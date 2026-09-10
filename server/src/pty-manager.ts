import os from 'os';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import * as nodePty from 'node-pty';
import { AgentSessionConfig, AgentSessionInfo, AgentStatus } from './types.js';
import { globalWorktreeManager } from './worktree-manager.js';
import { globalMessageBus } from './message-bus.js';

const isWindows = os.platform() === 'win32';
const ptySpawn = (nodePty as any).spawn || (nodePty as any).default?.spawn || (nodePty as any).default;

export interface TerminalSession {
  info: AgentSessionInfo;
  ptyProcess: nodePty.IPty;
  outputBuffer: string[];
  maxBufferSize: number;
  autoApprove: boolean;
  lineAccumulator: string;
  lastAutoApprovedAt: number;
  lastInjectedPrompt: string;
  responseAccumulator: string;
  responseTimer: NodeJS.Timeout | null;
  lastPublishedResponse: string;
}

function cleanTerminalResponse(rawText: string, lastPrompt?: string): string {
  // Strip ANSI color codes and control sequences
  let text = rawText
    .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Strip Antigravity / Gemini CLI ASCII Art header banner & version info
  text = text.replace(/Antigravity CLI[\s\S]*?Gemini[\s\S]*?\n/gi, '');
  text = text.replace(/^[ ]*[\u2580-\u259F\u2500-\u257F#\/\\]+.*$/gm, '');

  // Strip prompt status indicators and shortcut footers
  text = text.replace(/Accept-edits mode:.*$/gmi, '');
  text = text.replace(/\? for shortcuts.*$/gmi, '');
  text = text.replace(/\? for tools.*$/gmi, '');
  text = text.replace(/shift\+tab to toggle.*$/gmi, '');
  text = text.replace(/ctrl\+g edit\/expand.*$/gmi, '');
  text = text.replace(/esc to cancel.*$/gmi, '');
  text = text.replace(/Gemini 3\.7 Flash.*$/gmi, '');
  text = text.replace(/PS [A-Z]:\\[^\n>]*>/g, '');

  // Strip the echoed user prompt line
  if (lastPrompt) {
    const escaped = lastPrompt.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`>\\s*${escaped}`, 'gi'), '');
    text = text.replace(new RegExp(`^\\s*${escaped}`, 'gim'), '');
  }

  // Filter out startup lines & empty lines
  const lines = text
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => {
      const t = l.trim();
      if (!t) return false;
      if (/^(>|\$|#|PS )?$/.test(t)) return false;
      if (/^Copyright \(C\) Microsoft Corporation/i.test(t)) return false;
      if (/^All rights reserved/i.test(t)) return false;
      if (/^Antigravity CLI/i.test(t)) return false;
      if (/^C:\\[^\n]*server>/i.test(t)) return false;
      return true;
    });

  return lines.join('\n').trim();
}

export class PtyManager extends EventEmitter {
  private sessions: Map<string, TerminalSession> = new Map();
  private binPath: string;

  constructor() {
    super();
    this.binPath = path.resolve(process.cwd(), 'bin');
  }

  public getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  public listSessions(): AgentSessionInfo[] {
    return Array.from(this.sessions.values()).map((s) => s.info);
  }

  public setAutoApprove(id: string, enabled: boolean): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.autoApprove = enabled;
    session.info.autoApprove = enabled;
    return true;
  }

  private handleCrossAgentMentions(senderSession: TerminalSession, messageText: string) {
    for (const [targetId, targetSession] of this.sessions.entries()) {
      if (targetId === senderSession.info.id) continue;

      const targetName = targetSession.info.name.toLowerCase();
      const lowerText = messageText.toLowerCase();

      // If response mentions @AgentName or @AgentId
      if (lowerText.includes(`@${targetName}`) || lowerText.includes(`@${targetId}`)) {
        console.log(`[Cross-Talk] Relaying message from ${senderSession.info.name} to ${targetSession.info.name}`);
        const forwardedPrompt = `[From @${senderSession.info.name}]: ${messageText}`;
        this.write(targetId, forwardedPrompt + '\r');
      }
    }
  }

  public async createSession(config: AgentSessionConfig): Promise<AgentSessionInfo> {
    const id = config.id || `agent-${Date.now().toString(36)}`;
    
    // Check if session already exists
    if (this.sessions.has(id)) {
      throw new Error(`Session with ID ${id} already exists`);
    }

    let cwd = config.cwd ? path.resolve(config.cwd) : process.cwd();
    let worktreeBranch = config.worktreeBranch;
    let worktreePath: string | undefined;

    // Handle workspace isolation
    if (config.isolateWorktree) {
      try {
        const isolated = await globalWorktreeManager.createIsolatedWorkspace(
          id,
          cwd,
          worktreeBranch
        );
        cwd = isolated.path;
        worktreeBranch = isolated.branch;
        worktreePath = isolated.path;
      } catch (err: any) {
        console.error(`Failed to isolate workspace for ${id}:`, err);
      }
    }

    // Determine shell
    const defaultShell = isWindows ? 'powershell.exe' : (process.env.SHELL || 'bash');
    const shell = config.shell || defaultShell;

    // Environment variables
    const currentPath = process.env.PATH || '';
    const augmentedPath = `${this.binPath}${path.delimiter}${currentPath}`;

    const agentEnv: Record<string, string> = {
      ...process.env as Record<string, string>,
      PATH: augmentedPath,
      AGENT_ID: id,
      AGENT_NAME: config.name || id,
      AGENT_ROLE: config.role || 'Assistant',
      HARNESS_API_URL: 'http://localhost:3001/api',
      HARNESS_PORT: '3001',
      ...(config.env || {}),
    };

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444'];
    const assignedColor = config.color || colors[this.sessions.size % colors.length];

    // Arguments: if command provided, invoke via shell or direct
    const args: string[] = [];
    if (config.command) {
      if (isWindows && shell.toLowerCase().includes('powershell')) {
        args.push('-NoExit', '-Command', config.command);
      } else if (isWindows && shell.toLowerCase().includes('cmd')) {
        args.push('/K', config.command);
      } else {
        args.push('-c', config.command);
      }
    } else if (config.args && config.args.length > 0) {
      args.push(...config.args);
    }

    // Spawn PTY
    const ptyProcess = ptySpawn(shell, args, {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd,
      env: agentEnv,
    });

    const isAutoApprove = config.autoApprove !== false;

    const info: AgentSessionInfo = {
      id,
      name: config.name || `Agent ${id.substring(0, 6)}`,
      role: config.role || 'General',
      color: assignedColor,
      status: 'running',
      cwd,
      shell,
      command: config.command,
      pid: ptyProcess.pid,
      createdAt: Date.now(),
      isolateWorktree: !!config.isolateWorktree,
      worktreeBranch,
      worktreePath,
      autoApprove: isAutoApprove,
      env: config.env || {},
    };

    const session: TerminalSession = {
      info,
      ptyProcess,
      outputBuffer: [],
      maxBufferSize: 2000,
      autoApprove: isAutoApprove,
      lineAccumulator: '',
      lastAutoApprovedAt: 0,
      lastInjectedPrompt: '',
      responseAccumulator: '',
      responseTimer: null,
      lastPublishedResponse: '',
    };

    this.sessions.set(id, session);

    // Handle PTY data stream with intelligent auto-approval detection & Live Response Ingestion
    ptyProcess.onData((data: string) => {
      session.outputBuffer.push(data);
      if (session.outputBuffer.length > session.maxBufferSize) {
        session.outputBuffer.shift();
      }
      this.emit('data', { agentId: id, data });

      // 1. Auto-Approve Prompt Watcher
      if (session.autoApprove) {
        session.lineAccumulator += data;
        if (session.lineAccumulator.length > 2000) {
          session.lineAccumulator = session.lineAccumulator.slice(-1000);
        }

        const now = Date.now();
        if (now - session.lastAutoApprovedAt > 600) {
          const cleanText = session.lineAccumulator.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');

          // Match interactive arrow/selection menus
          if (
            /Allow access to this file\?/i.test(cleanText) ||
            /Allow execution of command\?/i.test(cleanText) ||
            /1\.\s*Yes,\s*allow access/i.test(cleanText)
          ) {
            session.lastAutoApprovedAt = now;
            session.lineAccumulator = '';
            setTimeout(() => {
              session.ptyProcess.write('1\r');
              globalMessageBus.publish(
                'system',
                'Auto-Approve',
                id,
                `⚡ Auto-approved access prompt (Selected Option 1) for [${info.name}]`,
                'system'
              );
            }, 100);
          }
          // Match standard y/n confirmation prompts
          else if (
            /\(y\/n\)/i.test(cleanText) ||
            /\[y\/N\]/i.test(cleanText) ||
            /Do you want to proceed\?/i.test(cleanText) ||
            /Do you want to continue\?/i.test(cleanText)
          ) {
            session.lastAutoApprovedAt = now;
            session.lineAccumulator = '';
            setTimeout(() => {
              session.ptyProcess.write('y\r');
              globalMessageBus.publish(
                'system',
                'Auto-Approve',
                id,
                `⚡ Auto-approved confirmation (y) for [${info.name}]`,
                'system'
              );
            }, 100);
          }
        }
      }

      // 2. Live Agent Response Ingestion (Terminal -> Group Chat Bridge)
      session.responseAccumulator += data;
      if (session.responseTimer) {
        clearTimeout(session.responseTimer);
      }

      const cleanSoFar = session.responseAccumulator.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
      const isPromptFinished = /Accept-edits mode|\? for shortcuts|\? for tools|esc to cancel/i.test(cleanSoFar);
      const delay = isPromptFinished ? 400 : 1400;

      session.responseTimer = setTimeout(() => {
        const cleaned = cleanTerminalResponse(session.responseAccumulator, session.lastInjectedPrompt);

        if (cleaned && cleaned.length > 3 && cleaned !== session.lastPublishedResponse) {
          if (!/^(agy|gemini|node|npm|git)$/i.test(cleaned) || cleaned.length > 20) {
            session.lastPublishedResponse = cleaned;
            session.responseAccumulator = '';

            // Publish Agent's response to Group Chat!
            globalMessageBus.publish(
              session.info.id,
              session.info.name,
              'all',
              cleaned,
              'chat'
            );

            // 3. Autonomous Cross-Agent Relaying (@mention detection)
            this.handleCrossAgentMentions(session, cleaned);
          }
        }
      }, delay);
    });

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode, signal }: { exitCode: number; signal?: number }) => {
      session.info.status = exitCode === 0 ? 'idle' : 'error';
      this.emit('exit', { agentId: id, exitCode, signal });
      globalMessageBus.publish(
        'system',
        'System',
        'all',
        `Agent [${info.name}] exited with code ${exitCode}`,
        'system',
        { agentId: id, exitCode }
      );
    });

    globalMessageBus.publish(
      'system',
      'System',
      'all',
      `Agent [${info.name}] (${info.role}) started in ${cwd}`,
      'system',
      { agentId: id }
    );

    this.emit('session:created', info);
    return info;
  }

  public write(id: string, data: string): boolean {
    const session = this.sessions.get(id);
    if (!session || !session.ptyProcess) return false;
    session.lastInjectedPrompt = data.trim();
    session.responseAccumulator = '';
    session.ptyProcess.write(data);
    return true;
  }

  public broadcast(data: string, targetIds?: string[]): number {
    let count = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (!targetIds || targetIds.includes(id)) {
        session.lastInjectedPrompt = data.trim();
        session.responseAccumulator = '';
        session.ptyProcess.write(data);
        count++;
      }
    }
    return count;
  }

  public resize(id: string, cols: number, rows: number): boolean {
    const session = this.sessions.get(id);
    if (!session || !session.ptyProcess) return false;
    try {
      session.ptyProcess.resize(Math.max(cols, 10), Math.max(rows, 5));
      return true;
    } catch (e) {
      console.warn(`Resize failed for ${id}:`, e);
      return false;
    }
  }

  public getHistory(id: string): string {
    const session = this.sessions.get(id);
    return session ? session.outputBuffer.join('') : '';
  }

  public async killSession(id: string, cleanupWorktree = false): Promise<boolean> {
    const session = this.sessions.get(id);
    if (!session) return false;

    if (session.responseTimer) {
      clearTimeout(session.responseTimer);
      session.responseTimer = null;
    }

    try {
      session.ptyProcess.kill();
    } catch (e) {
      // ignore
    }

    if (cleanupWorktree && session.info.isolateWorktree) {
      await globalWorktreeManager.cleanupWorkspace(id);
    }

    this.sessions.delete(id);
    this.emit('session:deleted', id);
    globalMessageBus.publish(
      'system',
      'System',
      'all',
      `Agent [${session.info.name}] terminated.`,
      'system',
      { agentId: id }
    );
    return true;
  }

  public async killAll(): Promise<void> {
    for (const id of this.sessions.keys()) {
      await this.killSession(id);
    }
  }
}

export const globalPtyManager = new PtyManager();
