import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { globalPtyManager } from './pty-manager.js';
import { globalMessageBus } from './message-bus.js';
import { globalBlackboard } from './blackboard.js';
import { AgentSessionConfig, SwarmPreset } from './types.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve client dist if built
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Built-in presets for quick swarms
const SWARM_PRESETS: SwarmPreset[] = [
  {
    id: 'coder-reviewer-pair',
    name: 'Coder + Reviewer Pair',
    description: 'Two agents working in tandem: one implements code while the other tests and reviews.',
    agents: [
      {
        name: 'Coder Agent',
        role: 'Developer (Gemini CLI)',
        color: '#6366f1',
        isolateWorktree: false,
      },
      {
        name: 'Reviewer Agent',
        role: 'QA / Reviewer (Claude Code)',
        color: '#ec4899',
        isolateWorktree: false,
      },
    ],
    initialTasks: [
      {
        title: 'Initial Architecture & Implementation',
        description: 'Coder Agent: Scaffold and implement requested features. Announce on bus when ready.',
        priority: 'high',
      },
      {
        title: 'Code Review & Test Verification',
        description: 'Reviewer Agent: Verify implementation, run tests, and report feedback via agent-bridge.',
        priority: 'high',
      },
    ],
  },
  {
    id: 'fullstack-trio',
    name: 'Fullstack Trio (Architect + Frontend + Backend)',
    description: '3 specialized agents collaborating through shared contracts and blackboard.',
    agents: [
      {
        name: 'Lead Architect',
        role: 'System Architect',
        color: '#f59e0b',
        isolateWorktree: false,
      },
      {
        name: 'Frontend Engineer',
        role: 'UI Developer',
        color: '#06b6d4',
        isolateWorktree: false,
      },
      {
        name: 'Backend Engineer',
        role: 'API & DB Developer',
        color: '#10b981',
        isolateWorktree: false,
      },
    ],
    initialTasks: [
      {
        title: 'Define API & Schema Contracts',
        description: 'Architect: Store API spec in blackboard using agent-bridge blackboard set "api_contract" {...}',
        priority: 'urgent',
      },
    ],
  },
  {
    id: 'git-isolated-swarm',
    name: 'Isolated Branch Swarm (Worktree Sandboxes)',
    description: 'Two developer agents running in independent Git Worktree branches to avoid file conflicts.',
    agents: [
      {
        name: 'Feature Alpha Agent',
        role: 'Feature Alpha Developer',
        color: '#8b5cf6',
        isolateWorktree: true,
        worktreeBranch: 'feature/agent-alpha',
      },
      {
        name: 'Feature Beta Agent',
        role: 'Feature Beta Developer',
        color: '#3b82f6',
        isolateWorktree: true,
        worktreeBranch: 'feature/agent-beta',
      },
    ],
  },
];

// --- REST API Endpoints ---

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), agents: globalPtyManager.listSessions().length });
});

// Agents
app.get('/api/agents', (req: Request, res: Response) => {
  res.json(globalPtyManager.listSessions());
});

app.post('/api/agents', async (req: Request, res: Response) => {
  try {
    const config: AgentSessionConfig = req.body;
    const sessionInfo = await globalPtyManager.createSession(config);
    res.status(201).json(sessionInfo);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/agents/:id', (req: Request, res: Response) => {
  const session = globalPtyManager.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(session.info);
});

app.get('/api/agents/:id/history', (req: Request, res: Response) => {
  const history = globalPtyManager.getHistory(req.params.id);
  res.json({ history });
});

app.delete('/api/agents/:id', async (req: Request, res: Response) => {
  const cleanup = req.query.cleanup === 'true';
  const success = await globalPtyManager.killSession(req.params.id, cleanup);
  if (!success) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json({ success: true });
});

app.post('/api/agents/:id/inject', (req: Request, res: Response) => {
  const { input } = req.body;
  if (typeof input !== 'string') {
    return res.status(400).json({ error: 'input string required' });
  }
  const formatted = input.endsWith('\n') || input.endsWith('\r') ? input : input + '\r';
  const success = globalPtyManager.write(req.params.id, formatted);
  if (!success) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json({ success: true });
});

app.post('/api/agents/:id/auto-approve', (req: Request, res: Response) => {
  const { enabled } = req.body;
  const success = globalPtyManager.setAutoApprove(req.params.id, !!enabled);
  if (!success) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json({ success: true, autoApprove: !!enabled });
});

// Cross-Agent Prompt Injection (types into target terminal & logs to bus)
app.post('/api/agents/:id/prompt', (req: Request, res: Response) => {
  const { prompt, senderId, senderName } = req.body;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt string required' });
  }
  const targetId = req.params.id;
  const target = globalPtyManager.getSession(targetId);
  if (!target) {
    return res.status(404).json({ error: `Target agent ${targetId} not found` });
  }

  // 1. Inject into target terminal stdin
  const formatted = prompt.endsWith('\n') || prompt.endsWith('\r') ? prompt : prompt + '\r';
  globalPtyManager.write(targetId, formatted);

  // 2. Publish to message bus so all agents and UI see the conversation
  const msg = globalMessageBus.publish(
    senderId || 'user',
    senderName || senderId || 'Supervisor',
    targetId,
    prompt,
    'chat'
  );

  res.json({ success: true, targetId, messageId: msg.id });
});

// In-Memory Conflict File Lock Manager
interface FileLock {
  resource: string;
  lockedBy: string;
  agentId: string;
  lockedAt: number;
}
const activeFileLocks = new Map<string, FileLock>();

app.get('/api/locks', (req: Request, res: Response) => {
  res.json(Array.from(activeFileLocks.values()));
});

app.post('/api/locks', (req: Request, res: Response) => {
  const { resource, agentId, lockedBy } = req.body;
  if (!resource) {
    return res.status(400).json({ error: 'resource string required' });
  }
  const existing = activeFileLocks.get(resource);
  if (existing && existing.agentId !== agentId) {
    return res.status(409).json({
      error: `Conflict: '${resource}' is currently locked by ${existing.lockedBy} (${existing.agentId})`,
      lock: existing,
    });
  }

  const lock: FileLock = {
    resource,
    agentId: agentId || 'unknown',
    lockedBy: lockedBy || agentId || 'Unknown Agent',
    lockedAt: Date.now(),
  };
  activeFileLocks.set(resource, lock);
  globalMessageBus.publish(
    agentId || 'system',
    lockedBy || 'System',
    'all',
    `Locked resource: ${resource}`,
    'event',
    { resource, action: 'lock' }
  );

  res.status(201).json(lock);
});

app.delete('/api/locks/:resource', (req: Request, res: Response) => {
  const resource = decodeURIComponent(req.params.resource);
  const lock = activeFileLocks.get(resource);
  if (!lock) {
    return res.json({ success: true, message: 'No active lock found' });
  }
  activeFileLocks.delete(resource);
  globalMessageBus.publish(
    lock.agentId,
    lock.lockedBy,
    'all',
    `Unlocked resource: ${resource}`,
    'event',
    { resource, action: 'unlock' }
  );

  res.json({ success: true, unlocked: resource });
});

app.post('/api/agents/:id/resize', (req: Request, res: Response) => {
  const { cols, rows } = req.body;
  if (!cols || !rows) {
    return res.status(400).json({ error: 'cols and rows required' });
  }
  const success = globalPtyManager.resize(req.params.id, cols, rows);
  res.json({ success });
});

app.post('/api/broadcast', (req: Request, res: Response) => {
  const { input, targetIds } = req.body;
  if (typeof input !== 'string') {
    return res.status(400).json({ error: 'input string required' });
  }
  const formatted = input.endsWith('\n') || input.endsWith('\r') ? input : input + '\r';
  const count = globalPtyManager.broadcast(formatted, targetIds);
  res.json({ success: true, count });
});

// Messages
app.get('/api/messages', (req: Request, res: Response) => {
  const agentId = req.query.agentId as string | undefined;
  const since = req.query.since ? parseInt(req.query.since as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

  const messages = globalMessageBus.getMessages(agentId, since, limit);
  res.json(messages);
});

app.post('/api/messages', (req: Request, res: Response) => {
  const { senderId, senderName, recipientId, content, type, metadata } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content required' });
  }
  const msg = globalMessageBus.publish(
    senderId || 'user',
    senderName || senderId || 'User',
    recipientId || 'all',
    content,
    type || 'chat',
    metadata
  );
  res.status(201).json(msg);
});

app.delete('/api/messages', (req: Request, res: Response) => {
  globalMessageBus.clear();
  res.json({ success: true });
});

// Blackboard (KV)
app.get('/api/blackboard', (req: Request, res: Response) => {
  res.json(globalBlackboard.getAll());
});

app.get('/api/blackboard/:key', (req: Request, res: Response) => {
  const entry = globalBlackboard.getEntry(req.params.key);
  if (!entry) {
    return res.status(404).json({ error: 'Key not found' });
  }
  res.json(entry);
});

app.post('/api/blackboard', (req: Request, res: Response) => {
  const { key, value, updatedBy, tags } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }
  const entry = globalBlackboard.set(key, value, updatedBy || 'Anonymous', tags);
  res.status(201).json(entry);
});

app.delete('/api/blackboard/:key', (req: Request, res: Response) => {
  const deleted = globalBlackboard.delete(req.params.key);
  res.json({ success: deleted });
});

// Scratchpad
app.get('/api/scratchpad', (req: Request, res: Response) => {
  res.json({ content: globalBlackboard.getScratchpad() });
});

app.post('/api/scratchpad', (req: Request, res: Response) => {
  const { content, updatedBy } = req.body;
  const updated = globalBlackboard.setScratchpad(content || '', updatedBy || 'User');
  res.json({ content: updated });
});

// Tasks
app.get('/api/tasks', (req: Request, res: Response) => {
  const status = req.query.status as any;
  const assignedTo = req.query.assignedTo as string | undefined;
  res.json(globalBlackboard.getTasks(status, assignedTo));
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const { title, description, createdBy, priority, assignedTo } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  const task = globalBlackboard.createTask(
    title,
    description || '',
    createdBy || 'User',
    priority || 'medium',
    assignedTo
  );
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req: Request, res: Response) => {
  const updated = globalBlackboard.updateTask(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(updated);
});

app.post('/api/tasks/:id/claim', (req: Request, res: Response) => {
  const { agentId } = req.body;
  if (!agentId) {
    return res.status(400).json({ error: 'agentId required' });
  }
  const task = globalBlackboard.claimTask(req.params.id, agentId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

app.post('/api/tasks/:id/complete', (req: Request, res: Response) => {
  const { result } = req.body;
  const task = globalBlackboard.completeTask(req.params.id, result);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const deleted = globalBlackboard.deleteTask(req.params.id);
  res.json({ success: deleted });
});

// Presets
app.get('/api/presets', (req: Request, res: Response) => {
  res.json(SWARM_PRESETS);
});

app.post('/api/presets/:id/launch', async (req: Request, res: Response) => {
  const preset = SWARM_PRESETS.find((p) => p.id === req.params.id);
  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }

  const spawnedAgents = [];
  for (const agentConfig of preset.agents) {
    const id = `${preset.id}-${agentConfig.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).slice(-4)}`;
    const session = await globalPtyManager.createSession({
      id,
      name: agentConfig.name,
      role: agentConfig.role,
      color: agentConfig.color,
      command: agentConfig.command,
      isolateWorktree: agentConfig.isolateWorktree,
      worktreeBranch: agentConfig.worktreeBranch,
    });
    spawnedAgents.push(session);
  }

  if (preset.initialTasks) {
    for (const t of preset.initialTasks) {
      globalBlackboard.createTask(t.title, t.description, 'Swarm Presets', t.priority);
    }
  }

  res.json({ success: true, spawned: spawnedAgents });
});

// --- WebSocket Management ---

const clients = new Set<WebSocket>();

function broadcastWS(type: string, payload: any) {
  const msg = JSON.stringify({ type, payload });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);

  // Send initial state snapshot
  ws.send(JSON.stringify({
    type: 'init',
    payload: {
      agents: globalPtyManager.listSessions(),
      messages: globalMessageBus.getMessages(undefined, undefined, 50),
      blackboard: globalBlackboard.getAll(),
      scratchpad: globalBlackboard.getScratchpad(),
      tasks: globalBlackboard.getTasks(),
      presets: SWARM_PRESETS,
    }
  }));

  ws.on('message', (raw: string) => {
    try {
      const data = JSON.parse(raw.toString());
      switch (data.type) {
        case 'pty:input':
          if (data.agentId && typeof data.data === 'string') {
            globalPtyManager.write(data.agentId, data.data);
          }
          break;

        case 'pty:resize':
          if (data.agentId && data.cols && data.rows) {
            globalPtyManager.resize(data.agentId, data.cols, data.rows);
          }
          break;

        case 'pty:history':
          if (data.agentId) {
            const history = globalPtyManager.getHistory(data.agentId);
            ws.send(JSON.stringify({
              type: 'pty:history',
              payload: { agentId: data.agentId, history }
            }));
          }
          break;

        case 'bus:send':
          if (data.content) {
            globalMessageBus.publish(
              data.senderId || 'user',
              data.senderName || 'User',
              data.recipientId || 'all',
              data.content,
              data.messageType || 'chat',
              data.metadata
            );
          }
          break;

        case 'broadcast:input':
          if (data.input) {
            const formatted = data.input.endsWith('\n') || data.input.endsWith('\r') ? data.input : data.input + '\r';
            globalPtyManager.broadcast(formatted, data.targetIds);
          }
          break;
      }
    } catch (e) {
      console.error('WS message handling error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Bind PTY events to WebSockets
globalPtyManager.on('data', ({ agentId, data }) => {
  broadcastWS('pty:data', { agentId, data });
});

globalPtyManager.on('session:created', (info) => {
  broadcastWS('agent:created', info);
});

globalPtyManager.on('session:deleted', (agentId) => {
  broadcastWS('agent:deleted', { agentId });
});

globalPtyManager.on('exit', ({ agentId, exitCode, signal }) => {
  broadcastWS('agent:exit', { agentId, exitCode, signal });
});

// Bind Message Bus events
globalMessageBus.on('message', (msg) => {
  broadcastWS('bus:message', msg);
});

globalMessageBus.on('clear', () => {
  broadcastWS('bus:clear', {});
});

// Bind Blackboard events
globalBlackboard.on('kv:updated', (entry) => {
  broadcastWS('blackboard:updated', entry);
});

globalBlackboard.on('kv:deleted', (key) => {
  broadcastWS('blackboard:deleted', { key });
});

globalBlackboard.on('scratchpad:updated', (data) => {
  broadcastWS('scratchpad:updated', data);
});

globalBlackboard.on('task:created', (task) => {
  broadcastWS('task:created', task);
});

globalBlackboard.on('task:updated', (task) => {
  broadcastWS('task:updated', task);
});

globalBlackboard.on('task:deleted', (taskId) => {
  broadcastWS('task:deleted', { taskId });
});

server.listen(port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Agent Harness Server running at http://localhost:${port}`);
  console.log(`⚡ WebSocket Stream ready at ws://localhost:${port}/ws`);
  console.log(`======================================================\n`);
});
