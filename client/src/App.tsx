import React, { useState, useEffect, useRef } from 'react';
import { 
  AgentSessionInfo, 
  AgentMessage, 
  BlackboardEntry, 
  HarnessTask, 
  SwarmPreset, 
  AgentSessionConfig, 
  MessageType, 
  TaskPriority, 
  TaskStatus,
  LayoutMode
} from './types.js';
import { ZenHeader } from './components/ZenHeader.js';
import { ZenDrawer, ZenDrawerTab } from './components/ZenDrawer.js';
import { TerminalWorkspace } from './components/TerminalWorkspace.js';
import { ZenPromptHUD } from './components/ZenPromptHUD.js';
import { NewAgentModal } from './components/NewAgentModal.js';
import { PresetSwarmModal } from './components/PresetSwarmModal.js';
import { CommandPalette } from './components/CommandPalette.js';
import { CrossTalkGuideModal } from './components/CrossTalkGuideModal.js';
import { ToastContainer, toast } from './components/Toast.js';
import { sound } from './utils/audio.js';
import { apiRequest, getWebSocketUrls } from './utils/api.js';

export const App: React.FC = () => {
  // State: Agents & Sessions
  const [agents, setAgents] = useState<AgentSessionInfo[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  // State: Communication & Shared Store
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [blackboard, setBlackboard] = useState<BlackboardEntry[]>([]);
  const [scratchpad, setScratchpad] = useState<string>('');
  const [tasks, setTasks] = useState<HarnessTask[]>([]);
  const [presets, setPresets] = useState<SwarmPreset[]>([]);

  // State: Layout & Zen Desktop
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default for 100% full-screen terminal space
  const [sidebarTab, setSidebarTab] = useState<ZenDrawerTab>('agents');
  const [isAutoApproveAll, setIsAutoApproveAll] = useState(true);

  // State: Modals & Controls
  const [isNewAgentModalOpen, setIsNewAgentModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCrossTalkGuideOpen, setIsCrossTalkGuideOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(sound.isEnabled());

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSpawnedRef = useRef<boolean>(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // New Agent (Ctrl+N or Cmd+N)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        setIsNewAgentModalOpen(true);
      }
      // Presets (Ctrl+P or Cmd+P)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPresetModalOpen(true);
      }
      // Toggle Sidebar Drawer (Ctrl+B or Cmd+B)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      // Focus Broadcast HUD (Ctrl+J or Cmd+J)
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        broadcastInputRef.current?.focus();
      }
      // Quick Tab Switch (Alt+1, Alt+2... or Ctrl+1, Ctrl+2...)
      else if ((e.altKey || e.ctrlKey) && !e.shiftKey && /^[1-9]$/.test(e.key)) {
        const targetIdx = parseInt(e.key, 10) - 1;
        if (targetIdx >= 0 && targetIdx < agents.length) {
          e.preventDefault();
          setActiveAgentId(agents[targetIdx].id);
          sound.playClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agents]);

  // Initial Fetch & WebSocket Connection with Auto-Fallback
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any;
    let fallbackTried = false;

    const { primary, fallback } = getWebSocketUrls();

    const connectWS = (url: string) => {
      try {
        ws = new WebSocket(url);

        ws.onopen = () => {
          setIsConnected(true);
          wsRef.current = ws;
          fallbackTried = false;
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
              case 'init': {
                const initialAgents = msg.payload.agents || [];
                setAgents(initialAgents);
                if (initialAgents.length > 0) {
                  setActiveAgentId(initialAgents[0].id);
                } else if (!hasAutoSpawnedRef.current) {
                  hasAutoSpawnedRef.current = true;
                  apiRequest('/agents', {
                    method: 'POST',
                    body: JSON.stringify({
                      id: 'terminal-1',
                      name: 'Terminal 1',
                      role: 'System Terminal',
                      color: '#6366f1',
                      shell: 'powershell.exe',
                      autoApprove: true,
                    }),
                  }).catch(() => {});
                }
                setMessages(msg.payload.messages || []);
                setBlackboard(msg.payload.blackboard || []);
                setScratchpad(msg.payload.scratchpad || '');
                setTasks(msg.payload.tasks || []);
                setPresets(msg.payload.presets || []);
                break;
              }

              case 'agent:created':
                sound.playSuccess();
                setAgents((prev) => {
                  const next = [...prev.filter((a) => a.id !== msg.payload.id), msg.payload];
                  return next;
                });
                setActiveAgentId(msg.payload.id);
                break;

              case 'agent:deleted':
                sound.playWarn();
                setAgents((prev) => prev.filter((a) => a.id !== msg.payload.agentId));
                break;

              case 'agent:exit':
                setAgents((prev) =>
                  prev.map((a) =>
                    a.id === msg.payload.agentId
                      ? { ...a, status: msg.payload.exitCode === 0 ? 'idle' : 'error' }
                      : a
                  )
                );
                break;

              case 'bus:message':
                sound.playChirp();
                setMessages((prev) => [...prev, msg.payload]);
                break;

              case 'bus:clear':
                setMessages([]);
                break;

              case 'blackboard:updated':
                sound.playChirp();
                setBlackboard((prev) => [
                  ...prev.filter((e) => e.key !== msg.payload.key),
                  msg.payload,
                ]);
                break;

              case 'blackboard:deleted':
                setBlackboard((prev) => prev.filter((e) => e.key !== msg.payload.key));
                break;

              case 'scratchpad:updated':
                setScratchpad(msg.payload.content);
                break;

              case 'task:created':
                sound.playSuccess();
                setTasks((prev) => [msg.payload, ...prev]);
                break;

              case 'task:updated':
                setTasks((prev) =>
                  prev.map((t) => (t.id === msg.payload.id ? msg.payload : t))
                );
                break;

              case 'task:deleted':
                setTasks((prev) => prev.filter((t) => t.id !== msg.payload.taskId));
                break;
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          setIsConnected(false);
          wsRef.current = null;
          if (!fallbackTried) {
            fallbackTried = true;
            connectWS(fallback);
          } else {
            reconnectTimer = setTimeout(() => connectWS(primary), 2500);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        reconnectTimer = setTimeout(() => connectWS(primary), 2500);
      }
    };

    connectWS(primary);

    // Initial HTTP data fetch
    const loadInitialData = async () => {
      try {
        const [agentsData, presetsData, messagesData, tasksData, bbData, scratchData] = await Promise.allSettled([
          apiRequest<AgentSessionInfo[]>('/agents'),
          apiRequest<SwarmPreset[]>('/presets'),
          apiRequest<AgentMessage[]>('/messages'),
          apiRequest<HarnessTask[]>('/tasks'),
          apiRequest<BlackboardEntry[]>('/blackboard'),
          apiRequest<{ content: string }>('/scratchpad'),
        ]);

        if (agentsData.status === 'fulfilled') {
          setAgents(agentsData.value);
          if (agentsData.value.length > 0) setActiveAgentId(agentsData.value[0].id);
        }
        if (presetsData.status === 'fulfilled') setPresets(presetsData.value);
        if (messagesData.status === 'fulfilled') setMessages(messagesData.value);
        if (tasksData.status === 'fulfilled') setTasks(tasksData.value);
        if (bbData.status === 'fulfilled') setBlackboard(bbData.value);
        if (scratchData.status === 'fulfilled') setScratchpad(scratchData.value.content || '');
      } catch (e) {}
    };

    loadInitialData();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  // Spawn agent API
  const handleSpawnAgent = async (config: AgentSessionConfig) => {
    try {
      const data = await apiRequest<AgentSessionInfo>('/agents', {
        method: 'POST',
        body: JSON.stringify({ ...config, autoApprove: isAutoApproveAll }),
      });
      toast.success('Agent Spawned', `${data.name} (${data.role}) started.`);
    } catch (err: any) {
      toast.error('Spawn Failed', err.message);
    }
  };

  // Kill agent API
  const handleKillAgent = async (agentId: string) => {
    try {
      await apiRequest(`/agents/${agentId}`, { method: 'DELETE' });
    } catch (err: any) {
      toast.error('Failed to terminate agent', err.message);
    }
  };

  // Kill all agents
  const handleKillAll = async () => {
    if (!confirm('Terminate all active agent terminal sessions?')) return;
    sound.playWarn();
    for (const a of agents) {
      await handleKillAgent(a.id);
    }
  };

  // Launch preset swarm
  const handleLaunchPreset = async (presetId: string) => {
    try {
      const data = await apiRequest<{ success: boolean; spawned: AgentSessionInfo[] }>(
        `/presets/${presetId}/launch`,
        { method: 'POST' }
      );
      toast.success('Swarm Launched', `Spawned ${data.spawned?.length || 0} agents.`);
    } catch (err: any) {
      toast.error('Launch Failed', err.message);
    }
  };

  // Broadcast command/input to all terminals
  const handleBroadcast = (input: string, targetIds?: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'broadcast:input',
          input,
          targetIds,
        })
      );
    } else {
      apiRequest('/broadcast', {
        method: 'POST',
        body: JSON.stringify({ input, targetIds }),
      }).catch((e) => toast.error('Broadcast failed', e.message));
    }
  };

  // Toggle Auto-Approve All
  const handleToggleAutoApproveAll = () => {
    const next = !isAutoApproveAll;
    setIsAutoApproveAll(next);
    sound.playClick();
    agents.forEach((a) => {
      apiRequest(`/agents/${a.id}/auto-approve`, {
        method: 'POST',
        body: JSON.stringify({ enabled: next }),
      }).catch(() => {});
    });
    toast.info(next ? '⚡ Auto-Allow Enabled' : 'Auto-Allow Disabled', next ? 'Prompts like "Allow access" and (y/n) will be answered automatically.' : 'Manual confirmation required.');
  };

  // Send message on bus & optionally pipe into terminal stdin
  const handleSendMessage = async (
    recipientId: string, 
    content: string, 
    type: MessageType = 'chat',
    pipeToTerminal: boolean = true
  ) => {
    // 1. Publish to Message Bus (via WS or REST)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'bus:send',
          senderId: 'user',
          senderName: 'Supervisor',
          recipientId,
          content,
          messageType: type,
        })
      );
    } else {
      apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({
          senderId: 'user',
          senderName: 'Supervisor',
          recipientId,
          content,
          type,
        }),
      }).catch((e) => toast.error('Message failed', e.message));
    }

    // 2. Automatically inject the text into the terminal stdin!
    const formatted = content.endsWith('\r') || content.endsWith('\n') ? content : content + '\r';
    if (recipientId === 'all') {
      handleBroadcast(formatted);
    } else {
      apiRequest(`/agents/${recipientId}/prompt`, {
        method: 'POST',
        body: JSON.stringify({ prompt: formatted, senderId: 'user', senderName: 'Supervisor' }),
      }).catch(() => {});
    }
  };

  // Clear messages
  const handleClearMessages = async () => {
    try {
      await apiRequest('/messages', { method: 'DELETE' });
    } catch (e: any) {
      toast.error('Clear failed', e.message);
    }
  };

  // Blackboard Operations
  const handleSetBlackboard = async (key: string, value: any) => {
    try {
      await apiRequest('/blackboard', {
        method: 'POST',
        body: JSON.stringify({ key, value, updatedBy: 'Supervisor' }),
      });
      toast.success('Variable Saved', `Key '${key}' updated.`);
    } catch (e: any) {
      toast.error('Save failed', e.message);
    }
  };

  const handleDeleteBlackboard = async (key: string) => {
    try {
      await apiRequest(`/blackboard/${encodeURIComponent(key)}`, { method: 'DELETE' });
    } catch (e: any) {
      toast.error('Delete failed', e.message);
    }
  };

  const handleSaveScratchpad = async (content: string) => {
    try {
      await apiRequest('/scratchpad', {
        method: 'POST',
        body: JSON.stringify({ content, updatedBy: 'Supervisor' }),
      });
      toast.success('Scratchpad Saved', 'Collaborative notes updated.');
    } catch (e: any) {
      toast.error('Save failed', e.message);
    }
  };

  // Task Operations
  const handleCreateTask = async (
    title: string,
    description: string,
    priority: TaskPriority,
    assignedTo?: string
  ) => {
    try {
      await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description, priority, assignedTo, createdBy: 'Supervisor' }),
      });
      toast.success('Task Created', title);
    } catch (e: any) {
      toast.error('Task creation failed', e.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (e: any) {
      toast.error('Status update failed', e.message);
    }
  };

  const handleClaimTask = async (taskId: string, agentId: string) => {
    try {
      await apiRequest(`/tasks/${taskId}/claim`, {
        method: 'POST',
        body: JSON.stringify({ agentId }),
      });
    } catch (e: any) {
      toast.error('Claim failed', e.message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
    } catch (e: any) {
      toast.error('Delete failed', e.message);
    }
  };

  const handleToggleSound = () => {
    const next = sound.toggle();
    setIsSoundEnabled(next);
    toast.info(next ? 'Sound FX Enabled' : 'Sound FX Muted');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090e] text-slate-100 overflow-hidden font-sans select-none">
      {/* Toast Notification Layer */}
      <ToastContainer />

      {/* 1. Single Unified Zen Header (40px) */}
      <ZenHeader
        agents={agents}
        activeAgentId={activeAgentId}
        layout={layout}
        isSidebarOpen={isSidebarOpen}
        isSoundEnabled={isSoundEnabled}
        isAutoApproveAll={isAutoApproveAll}
        messageCount={messages.length}
        onSelectAgent={(id) => setActiveAgentId(id)}
        onReorderAgents={(reordered) => setAgents(reordered)}
        onKillAgent={handleKillAgent}
        onOpenNewAgent={() => setIsNewAgentModalOpen(true)}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        onOpenChat={() => {
          setSidebarTab('messages');
          setIsSidebarOpen(true);
        }}
        onChangeLayout={setLayout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleSound={handleToggleSound}
        onToggleAutoApproveAll={handleToggleAutoApproveAll}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenHelp={() => setIsCrossTalkGuideOpen(true)}
      />

      {/* 2. Edge-to-Edge Workspace Canvas */}
      <div className="flex-1 flex relative overflow-hidden bg-[#07090e]">
        {/* Slide-Out Glass Activity Drawer */}
        <ZenDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          agents={agents}
          presets={presets}
          messages={messages}
          tasks={tasks}
          blackboard={blackboard}
          scratchpad={scratchpad}
          activeAgentId={activeAgentId}
          activeTab={sidebarTab}
          onSelectTab={setSidebarTab}
          onSelectAgent={(id) => setActiveAgentId(id)}
          onOpenNewAgent={() => setIsNewAgentModalOpen(true)}
          onOpenPresets={() => setIsPresetModalOpen(true)}
          onLaunchPreset={handleLaunchPreset}
          onKillAgent={handleKillAgent}
          onSendMessage={handleSendMessage}
          onClearMessages={handleClearMessages}
          onSetBlackboard={handleSetBlackboard}
          onDeleteBlackboard={handleDeleteBlackboard}
          onSaveScratchpad={handleSaveScratchpad}
          onCreateTask={handleCreateTask}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onClaimTask={handleClaimTask}
          onDeleteTask={handleDeleteTask}
          onOpenHelp={() => setIsCrossTalkGuideOpen(true)}
        />

        {/* 100% Full-Bleed Terminal Viewport */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          <TerminalWorkspace
            agents={agents}
            presets={presets}
            ws={wsRef.current}
            layout={layout}
            onChangeLayout={setLayout}
            activeAgentId={activeAgentId}
            onSelectAgent={(id) => setActiveAgentId(id)}
            onReorderAgents={(reordered) => setAgents(reordered)}
            onKillAgent={handleKillAgent}
            onOpenNewAgent={() => setIsNewAgentModalOpen(true)}
            onOpenPresets={() => setIsPresetModalOpen(true)}
            onLaunchPreset={handleLaunchPreset}
            onSpawnQuickAgent={handleSpawnAgent}
          />

          {/* Floating Warp/Raycast Glass Prompt HUD */}
          <ZenPromptHUD
            agents={agents}
            onBroadcast={handleBroadcast}
            inputRef={broadcastInputRef}
          />
        </main>
      </div>

      {/* Modals & Dialogs */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        agents={agents}
        presets={presets}
        onOpenNewAgent={() => setIsNewAgentModalOpen(true)}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        onLaunchPreset={handleLaunchPreset}
        onChangeLayout={setLayout}
        onSelectSideTab={(tab) => {
          if (tab === 'messages') setSidebarTab('messages');
          else if (tab === 'tasks' || tab === 'blackboard' || tab === 'scratchpad') setSidebarTab('tasks');
          setIsSidebarOpen(true);
        }}
        onKillAll={handleKillAll}
        onToggleSound={handleToggleSound}
        isSoundEnabled={isSoundEnabled}
        onFocusBroadcast={() => broadcastInputRef.current?.focus()}
      />

      <NewAgentModal
        isOpen={isNewAgentModalOpen}
        onClose={() => setIsNewAgentModalOpen(false)}
        onSpawn={handleSpawnAgent}
      />

      <PresetSwarmModal
        isOpen={isPresetModalOpen}
        presets={presets}
        onClose={() => setIsPresetModalOpen(false)}
        onLaunchPreset={handleLaunchPreset}
      />

      <CrossTalkGuideModal
        isOpen={isCrossTalkGuideOpen}
        onClose={() => setIsCrossTalkGuideOpen(false)}
      />
    </div>
  );
};
