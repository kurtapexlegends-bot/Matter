#!/usr/bin/env node

/**
 * Matter - Agent Bridge CLI Tool
 * Allows agents inside terminals to communicate with each other,
 * trigger prompts in peer terminals, manage shared blackboard & tasks,
 * and lock files to prevent conflicts.
 */

const http = require('http');

const API_URL = process.env.HARNESS_API_URL || 'http://localhost:3001/api';
const CURRENT_AGENT_ID = process.env.AGENT_ID || 'cli-user';
const CURRENT_AGENT_NAME = process.env.AGENT_NAME || CURRENT_AGENT_ID;

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const flags = {};
  const positional = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const next = args[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { command, flags, positional };
}

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || `HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Failed to connect to Matter daemon at ${API_URL}: ${err.message}`));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  const { command, flags, positional } = parseArgs();

  try {
    switch (command) {
      // Direct Cross-Agent Prompting (types into peer terminal & logs to bus)
      case 'prompt':
      case 'tell':
      case 'ask': {
        const target = flags.to || flags.t || positional[0];
        const prompt = flags.msg || flags.m || (flags.to || flags.t ? positional.join(' ') : positional.slice(1).join(' '));

        if (!target || !prompt) {
          console.error('Usage: agent-bridge prompt --to <agentId> "<prompt/task to execute>"');
          process.exit(1);
        }

        const res = await request(`/agents/${encodeURIComponent(target)}/prompt`, 'POST', {
          prompt,
          senderId: CURRENT_AGENT_ID,
          senderName: CURRENT_AGENT_NAME,
        });

        console.log(`\x1b[32m✔ Prompt delivered directly to @${target}\x1b[0m`);
        break;
      }

      // Send Message to Bus
      case 'send': {
        const recipient = flags.to || flags.t || positional[0];
        const content = flags.msg || flags.m || (flags.to ? positional.join(' ') : positional.slice(1).join(' '));
        const type = flags.type || 'chat';

        if (!recipient || !content) {
          console.error('Usage: agent-bridge send --to <agentId> "<message>" [--type chat|task|contract|event]');
          process.exit(1);
        }

        const res = await request('/messages', 'POST', {
          senderId: CURRENT_AGENT_ID,
          senderName: CURRENT_AGENT_NAME,
          recipientId: recipient,
          content,
          type,
        });

        console.log(`\x1b[32m✔ Message sent to ${recipient} on Matter Bus\x1b[0m`);
        break;
      }

      // Broadcast Message to All
      case 'broadcast': {
        const content = flags.msg || flags.m || positional.join(' ');
        if (!content) {
          console.error('Usage: agent-bridge broadcast "<message>"');
          process.exit(1);
        }

        const res = await request('/messages', 'POST', {
          senderId: CURRENT_AGENT_ID,
          senderName: CURRENT_AGENT_NAME,
          recipientId: 'all',
          content,
          type: 'broadcast',
        });

        console.log(`\x1b[35m✔ Broadcasted to all active terminals\x1b[0m`);
        break;
      }

      // View Inbox / Messages
      case 'messages':
      case 'inbox': {
        const limit = flags.limit || 20;
        const since = flags.since || 0;
        const res = await request(`/messages?agentId=${CURRENT_AGENT_ID}&limit=${limit}&since=${since}`);
        
        if (!res || res.length === 0) {
          console.log('No recent messages.');
        } else {
          console.log(`\n--- Messages for ${CURRENT_AGENT_NAME} (${res.length}) ---`);
          res.forEach((m) => {
            const time = new Date(m.timestamp).toLocaleTimeString();
            console.log(`[${time}] \x1b[36m${m.senderName}\x1b[0m -> \x1b[33m${m.recipientId}\x1b[0m (${m.type}): ${m.content}`);
          });
          console.log('');
        }
        break;
      }

      // List Active Agents
      case 'agents':
      case 'who': {
        const agents = await request('/agents');
        console.log(`\n--- Active Matter Terminals (${agents.length}) ---`);
        agents.forEach((a) => {
          const isSelf = a.id === CURRENT_AGENT_ID ? ' (YOU)' : '';
          console.log(`• \x1b[1m${a.name}\x1b[0m [@${a.id}]${isSelf} | Role: ${a.role} | Status: ${a.status}`);
        });
        console.log('');
        break;
      }

      // File Conflict Prevention Locks
      case 'lock': {
        const resource = positional[0] || flags.file || flags.resource;
        if (!resource) {
          console.error('Usage: agent-bridge lock <file/resource>');
          process.exit(1);
        }

        try {
          const res = await request('/locks', 'POST', {
            resource,
            agentId: CURRENT_AGENT_ID,
            lockedBy: CURRENT_AGENT_NAME,
          });
          console.log(`\x1b[32m✔ Locked resource '${resource}' successfully.\x1b[0m`);
        } catch (e) {
          console.error(`\x1b[31m✖ ${e.message}\x1b[0m`);
          process.exit(1);
        }
        break;
      }

      case 'unlock': {
        const resource = positional[0] || flags.file || flags.resource;
        if (!resource) {
          console.error('Usage: agent-bridge unlock <file/resource>');
          process.exit(1);
        }

        await request(`/locks/${encodeURIComponent(resource)}`, 'DELETE');
        console.log(`\x1b[32m✔ Unlocked resource '${resource}'.\x1b[0m`);
        break;
      }

      case 'locks': {
        const locks = await request('/locks');
        console.log(`\n--- Active Resource Locks (${locks.length}) ---`);
        if (locks.length === 0) {
          console.log('No resources currently locked.');
        } else {
          locks.forEach((l) => {
            console.log(`• \x1b[33m${l.resource}\x1b[0m locked by ${l.lockedBy} (@${l.agentId})`);
          });
        }
        console.log('');
        break;
      }

      // Shared Blackboard (KV)
      case 'blackboard':
      case 'bb': {
        const sub = positional[0] || 'list';
        if (sub === 'set') {
          const key = positional[1];
          const val = positional.slice(2).join(' ') || flags.val || '';
          if (!key) {
            console.error('Usage: agent-bridge blackboard set <key> <value>');
            process.exit(1);
          }
          let parsedVal = val;
          try {
            parsedVal = JSON.parse(val);
          } catch (e) {}

          await request('/blackboard', 'POST', {
            key,
            value: parsedVal,
            updatedBy: CURRENT_AGENT_NAME,
          });
          console.log(`\x1b[32m✔ [Blackboard] Set '${key}' successfully.\x1b[0m`);
        } else if (sub === 'get') {
          const key = positional[1];
          if (!key) {
            console.error('Usage: agent-bridge blackboard get <key>');
            process.exit(1);
          }
          const entry = await request(`/blackboard/${encodeURIComponent(key)}`);
          if (entry) {
            console.log(typeof entry.value === 'object' ? JSON.stringify(entry.value, null, 2) : entry.value);
          } else {
            console.log(`Key '${key}' not found.`);
          }
        } else {
          const all = await request('/blackboard');
          console.log(`\n--- Shared Blackboard Variables (${all.length}) ---`);
          if (all.length === 0) {
            console.log('(Empty)');
          } else {
            all.forEach((e) => {
              console.log(`• \x1b[1m${e.key}\x1b[0m: ${JSON.stringify(e.value)} (by ${e.updatedBy})`);
            });
          }
          console.log('');
        }
        break;
      }

      // Collaborative Tasks
      case 'task': {
        const sub = positional[0] || 'list';
        if (sub === 'add') {
          const title = positional.slice(1).join(' ') || flags.title;
          const description = flags.desc || flags.description || '';
          const priority = flags.priority || 'medium';
          const assign = flags.assign;

          if (!title) {
            console.error('Usage: agent-bridge task add "<title>" [--desc "<desc>"] [--priority low|medium|high|urgent] [--assign <agentId>]');
            process.exit(1);
          }

          const task = await request('/tasks', 'POST', {
            title,
            description,
            priority,
            assignedTo: assign,
            createdBy: CURRENT_AGENT_NAME,
          });

          console.log(`\x1b[32m✔ [Task Created] ID: ${task.id} - "${task.title}"\x1b[0m`);
        } else if (sub === 'claim') {
          const taskId = positional[1] || flags.id;
          if (!taskId) {
            console.error('Usage: agent-bridge task claim <taskId>');
            process.exit(1);
          }
          const task = await request(`/tasks/${taskId}/claim`, 'POST', {
            agentId: CURRENT_AGENT_ID,
          });
          console.log(`\x1b[32m✔ [Task Claimed] ID: ${task.id} by ${CURRENT_AGENT_NAME}\x1b[0m`);
        } else if (sub === 'complete') {
          const taskId = positional[1] || flags.id;
          const result = flags.result || positional.slice(2).join(' ') || '';
          if (!taskId) {
            console.error('Usage: agent-bridge task complete <taskId> [--result "<summary>"]');
            process.exit(1);
          }
          const task = await request(`/tasks/${taskId}/complete`, 'POST', {
            result,
          });
          console.log(`\x1b[32m✔ [Task Completed] ID: ${task.id}\x1b[0m`);
        } else {
          const status = flags.status;
          const tasks = await request(`/tasks${status ? `?status=${status}` : ''}`);
          console.log(`\n--- Task Board (${tasks.length}) ---`);
          if (tasks.length === 0) {
            console.log('(No tasks)');
          } else {
            tasks.forEach((t) => {
              const assignee = t.assignedTo ? `[@${t.assignedTo}]` : '[Unassigned]';
              console.log(`[${t.status.toUpperCase()}] \x1b[1m${t.id}\x1b[0m: ${t.title} ${assignee} (Priority: ${t.priority})`);
            });
          }
          console.log('');
        }
        break;
      }

      case 'status': {
        console.log(`
--- Matter Terminal Agent Status ---
Name:       ${CURRENT_AGENT_NAME}
Agent ID:   ${CURRENT_AGENT_ID}
Daemon:     ${API_URL}
WorkingDir: ${process.cwd()}
`);
        break;
      }

      case 'help':
      default: {
        console.log(`
⚛️ Matter - Agent Bridge CLI Tool

Cross-Agent Communication:
  agent-bridge prompt --to <agentId> "<prompt>"    Type prompt directly into peer agent terminal
  agent-bridge send --to <agentId> "<message>"     Send message to Matter Bus
  agent-bridge broadcast "<message>"               Broadcast to all agents
  agent-bridge messages                            View recent incoming messages
  agent-bridge agents                              List all active agents

Conflict Prevention & Locking:
  agent-bridge lock <file/resource>                Lock file to prevent edit conflicts
  agent-bridge unlock <file/resource>              Release file lock
  agent-bridge locks                               List all active resource locks

Shared Memory & Tasks:
  agent-bridge blackboard set <key> <val>          Store shared API contract/variable
  agent-bridge blackboard get <key>                Read variable
  agent-bridge task add "<title>"                  Add task to shared queue
  agent-bridge task claim <id>                     Claim task
  agent-bridge task complete <id>                  Complete task

Current Session: ${CURRENT_AGENT_NAME} [@${CURRENT_AGENT_ID}]
`);
        break;
      }
    }
  } catch (err) {
    console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
    process.exit(1);
  }
}

main();
