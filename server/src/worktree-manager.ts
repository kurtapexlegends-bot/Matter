import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class WorktreeManager {
  private baseDir: string;

  constructor(baseDir = path.resolve(process.cwd(), '.harness_workspaces')) {
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public isGitRepo(dir: string): boolean {
    let curr = path.resolve(dir);
    while (curr !== path.dirname(curr)) {
      if (fs.existsSync(path.join(curr, '.git'))) {
        return true;
      }
      curr = path.dirname(curr);
    }
    return false;
  }

  public getGitRoot(dir: string): string | null {
    let curr = path.resolve(dir);
    while (curr !== path.dirname(curr)) {
      if (fs.existsSync(path.join(curr, '.git'))) {
        return curr;
      }
      curr = path.dirname(curr);
    }
    return null;
  }

  public async createIsolatedWorkspace(
    agentId: string,
    sourceDir: string,
    branchName?: string
  ): Promise<{ path: string; isWorktree: boolean; branch?: string }> {
    const safeAgentId = agentId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetDir = path.join(this.baseDir, safeAgentId);

    const gitRoot = this.getGitRoot(sourceDir);

    if (gitRoot) {
      const branch = branchName || `agent/${safeAgentId}-${Date.now().toString(36)}`;
      try {
        if (!fs.existsSync(targetDir)) {
          // Add git worktree
          await execFileAsync('git', ['worktree', 'add', '-b', branch, targetDir, 'HEAD'], {
            cwd: gitRoot,
          });
          return { path: targetDir, isWorktree: true, branch };
        } else {
          return { path: targetDir, isWorktree: true, branch };
        }
      } catch (err: any) {
        console.warn(`Git worktree creation failed: ${err.message}. Falling back to directory copy.`);
      }
    }

    // Fallback: directory sandbox
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    return { path: targetDir, isWorktree: false };
  }

  public async cleanupWorkspace(agentId: string, sourceDir?: string): Promise<void> {
    const safeAgentId = agentId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const targetDir = path.join(this.baseDir, safeAgentId);

    if (!fs.existsSync(targetDir)) return;

    const gitRoot = sourceDir ? this.getGitRoot(sourceDir) : null;
    if (gitRoot) {
      try {
        await execFileAsync('git', ['worktree', 'remove', '--force', targetDir], {
          cwd: gitRoot,
        });
      } catch (e) {
        // ignore
      }
    }

    try {
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Failed to remove workspace ${targetDir}:`, err);
    }
  }

  public listWorkspaces(): string[] {
    if (!fs.existsSync(this.baseDir)) return [];
    return fs.readdirSync(this.baseDir);
  }
}

export const globalWorktreeManager = new WorktreeManager();
