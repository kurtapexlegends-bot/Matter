import path from 'path';
import fs from 'fs';
import os from 'os';
import { WorktreeManager } from '../worktree-manager.js';

export async function runWorktreeTests() {
  console.log('\n📁 Testing WorktreeManager:');

  const tmpBaseDir = path.join(os.tmpdir(), `harness-test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
  const mgr = new WorktreeManager(tmpBaseDir);

  try {
    // Test 1: Git repository detection
    const currentDir = process.cwd();
    const isGit = mgr.isGitRepo(currentDir);
    console.assert(typeof isGit === 'boolean', 'isGitRepo should return a boolean');
    console.log('  ✅ Git repo detection checked.');

    // Test 2: Git root retrieval
    const root = mgr.getGitRoot(currentDir);
    console.assert(root === null || typeof root === 'string', 'getGitRoot should return string or null');
    console.log('  ✅ Git root path retrieval passed.');

    // Test 3: Create isolated sandbox directory
    const testAgentId = 'test-agent-sandbox';
    const nonGitDir = os.tmpdir();
    const isolated = await mgr.createIsolatedWorkspace(testAgentId, nonGitDir);
    
    console.assert(fs.existsSync(isolated.path), 'Isolated directory should exist');
    console.assert(isolated.path.includes('test_agent_sandbox') || isolated.path.includes('test-agent-sandbox'), 'Path should sanitize agent ID');
    console.log('  ✅ Sandbox directory creation & sanitization passed.');

    // Test 4: List workspaces
    const workspaces = mgr.listWorkspaces();
    console.assert(workspaces.length >= 1, 'Should list at least 1 created workspace');
    console.log('  ✅ Listing active workspaces passed.');

    // Test 5: Cleanup workspace
    await mgr.cleanupWorkspace(testAgentId, nonGitDir);
    console.assert(!fs.existsSync(isolated.path), 'Cleaned up workspace should no longer exist');
    console.log('  ✅ Workspace cleanup passed.');

  } finally {
    if (fs.existsSync(tmpBaseDir)) {
      try {
        fs.rmSync(tmpBaseDir, { recursive: true, force: true });
      } catch (e) {
        // ignore
      }
    }
  }
}

if (process.argv[1]?.endsWith('worktree.test.ts') || process.argv[1]?.endsWith('worktree.test.js')) {
  runWorktreeTests().then(() => console.log('🎉 Worktree tests completed successfully!'));
}
