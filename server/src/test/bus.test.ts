import { MessageBus } from '../message-bus.js';
import { Blackboard } from '../blackboard.js';

function runTests() {
  console.log('🧪 Running Agent Harness Test Suite...\n');

  // Test 1: Message Bus Direct & Broadcast
  console.log('1. Testing Message Bus:');
  const bus = new MessageBus();
  
  const msg1 = bus.publish('agent-1', 'Agent 1', 'agent-2', 'Hello Agent 2!', 'chat');
  const msg2 = bus.publish('agent-2', 'Agent 2', 'all', 'Broadcast to swarm', 'broadcast');
  const msg3 = bus.publish('agent-3', 'Agent 3', 'agent-1', 'API ready', 'contract');

  const agent1Messages = bus.getMessages('agent-1');
  console.assert(agent1Messages.length === 3, `Expected 3 messages for agent-1, got ${agent1Messages.length}`);
  
  const agent2Messages = bus.getMessages('agent-2');
  console.assert(agent2Messages.length === 2, `Expected 2 messages for agent-2, got ${agent2Messages.length}`);
  
  console.log('  ✅ Message Bus direct and broadcast routing passed.');

  // Test 2: Blackboard KV Store
  console.log('2. Testing Shared Blackboard KV Store:');
  const bb = new Blackboard();

  bb.set('api_schema', { users: '/api/v1/users', auth: '/api/v1/auth' }, 'Agent 1');
  const schema = bb.get('api_schema');
  console.assert(schema.users === '/api/v1/users', 'Blackboard KV retrieve failed');

  bb.delete('api_schema');
  console.assert(bb.get('api_schema') === undefined, 'Blackboard delete failed');
  console.log('  ✅ Blackboard Key-Value operations passed.');

  // Test 3: Shared Tasks & Lifecycle
  console.log('3. Testing Task Board Lifecycle:');
  const task = bb.createTask('Implement Auth Module', 'Create JWT auth router', 'Supervisor', 'urgent');
  console.assert(task.status === 'todo', 'Task initial status should be todo');

  const claimed = bb.claimTask(task.id, 'agent-1');
  console.assert(claimed?.status === 'in_progress', 'Task should be in_progress after claim');
  console.assert(claimed?.assignedTo === 'agent-1', 'Task should be assigned to agent-1');

  const completed = bb.completeTask(task.id, 'Implemented JWT token verification');
  console.assert(completed?.status === 'done', 'Task should be marked done');
  console.assert(completed?.result === 'Implemented JWT token verification', 'Task result should match');

  console.log('  ✅ Task board lifecycle (create -> claim -> complete) passed.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
}

runTests();
