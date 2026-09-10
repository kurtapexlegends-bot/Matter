import { PtyManager } from '../pty-manager.js';

export async function runPtyTests() {
  console.log('\n🖥️ Testing PtyManager Lifecycle & Control:');

  const ptyManager = new PtyManager();
  const testAgentId = `test-agent-${Date.now().toString(36)}`;

  try {
    // Test 1: Create PTY Session
    console.log('1. Spawning PTY Session:');
    const sessionInfo = await ptyManager.createSession({
      id: testAgentId,
      name: 'Test Worker',
      role: 'QA Automation',
      color: '#10b981',
      autoApprove: true,
    });

    console.assert(sessionInfo.id === testAgentId, 'Session ID mismatch');
    console.assert(sessionInfo.name === 'Test Worker', 'Session Name mismatch');
    console.assert(sessionInfo.status === 'running', 'Session status should be running');
    console.assert(typeof sessionInfo.pid === 'number', 'PTY process PID should be defined');
    console.log('  ✅ PTY session created successfully with PID:', sessionInfo.pid);

    // Test 2: List and Get Sessions
    const sessions = ptyManager.listSessions();
    console.assert(sessions.some((s) => s.id === testAgentId), 'listSessions should include test agent');

    const session = ptyManager.getSession(testAgentId);
    console.assert(session !== undefined, 'getSession should return session');
    console.assert(session?.info.autoApprove === true, 'autoApprove should be enabled');
    console.log('  ✅ Session lookup and listing verified.');

    // Test 3: Auto Approve Toggle
    ptyManager.setAutoApprove(testAgentId, false);
    console.assert(ptyManager.getSession(testAgentId)?.autoApprove === false, 'autoApprove should be disabled');
    ptyManager.setAutoApprove(testAgentId, true);
    console.assert(ptyManager.getSession(testAgentId)?.autoApprove === true, 'autoApprove should be re-enabled');
    console.log('  ✅ Auto-approve toggle verified.');

    // Test 4: Writing input & Broadcast
    const wrote = ptyManager.write(testAgentId, 'echo "PTY Test Execution"\r');
    console.assert(wrote === true, 'write to session should return true');

    const broadcastCount = ptyManager.broadcast('echo "Broadcast Test"\r', [testAgentId]);
    console.assert(broadcastCount === 1, 'Broadcast should reach exactly 1 targeted session');
    console.log('  ✅ Terminal stdin write and targeted broadcast verified.');

    // Test 5: Resize terminal
    const resized = ptyManager.resize(testAgentId, 120, 40);
    console.assert(resized === true, 'Terminal resize should succeed');
    console.log('  ✅ Terminal resize verified.');

    // Test 6: Duplicate ID rejection
    let duplicateRejected = false;
    try {
      await ptyManager.createSession({ id: testAgentId, name: 'Dup', role: 'Dev' });
    } catch (err: any) {
      duplicateRejected = true;
    }
    console.assert(duplicateRejected, 'Creating session with duplicate ID should throw');
    console.log('  ✅ Duplicate session prevention verified.');

    // Wait slightly for output buffer
    await new Promise((resolve) => setTimeout(resolve, 500));
    const history = ptyManager.getHistory(testAgentId);
    console.assert(typeof history === 'string', 'getHistory should return string buffer');
    console.log('  ✅ Terminal history buffer recorded (length:', history.length, 'bytes)');

    // Test 7: Kill Session
    const killed = await ptyManager.killSession(testAgentId);
    console.assert(killed === true, 'killSession should return true');
    console.assert(ptyManager.getSession(testAgentId) === undefined, 'Session should be removed after kill');
    console.log('  ✅ Session termination and cleanup verified.');

  } catch (err) {
    console.error('PTY test error:', err);
    throw err;
  }
}

if (process.argv[1]?.endsWith('pty.test.ts') || process.argv[1]?.endsWith('pty.test.js')) {
  runPtyTests().then(() => console.log('🎉 PTY tests completed successfully!'));
}
