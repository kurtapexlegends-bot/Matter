import React, { useState } from 'react';
import { 
  AgentSessionInfo, 
  SwarmPreset, 
  AgentMessage, 
  HarnessTask, 
  BlackboardEntry,
  MessageType,
  TaskPriority,
  TaskStatus
} from '../types.js';
import { AgentGroupChat } from './AgentGroupChat.js';
import { BlackboardView } from './BlackboardView.js';
import { sound } from '../utils/audio.js';
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  GitBranch, 
  Terminal, 
  Search, 
  MessageSquare, 
  ListTodo, 
  Play, 
  HelpCircle,
  X,
  Layers,
  Zap,
  CheckCircle2
} from 'lucide-react';

export type ZenDrawerTab = 'agents' | 'swarms' | 'messages' | 'tasks';

interface ZenDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentSessionInfo[];
  presets: SwarmPreset[];
  messages: AgentMessage[];
  tasks: HarnessTask[];
  blackboard: BlackboardEntry[];
  scratchpad: string;
  activeAgentId: string | null;
  activeTab: ZenDrawerTab;
  onSelectTab: (tab: ZenDrawerTab) => void;
  onSelectAgent: (id: string) => void;
  onOpenNewAgent: () => void;
  onOpenPresets: () => void;
  onLaunchPreset: (id: string) => void;
  onKillAgent: (id: string) => void;
  onSendMessage: (recipientId: string, content: string, type: MessageType, pipeToTerminal?: boolean) => void;
  onClearMessages: () => void;
  onSetBlackboard: (key: string, value: any) => void;
  onDeleteBlackboard: (key: string) => void;
  onSaveScratchpad: (content: string) => void;
  onCreateTask: (title: string, description: string, priority: TaskPriority, assignedTo?: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onClaimTask: (taskId: string, agentId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenHelp: () => void;
}

export const ZenDrawer: React.FC<ZenDrawerProps> = ({
  isOpen,
  onClose,
  agents,
  presets,
  messages,
  tasks,
  blackboard,
  scratchpad,
  activeAgentId,
  activeTab,
  onSelectTab,
  onSelectAgent,
  onOpenNewAgent,
  onOpenPresets,
  onLaunchPreset,
  onKillAgent,
  onSendMessage,
  onClearMessages,
  onSetBlackboard,
  onDeleteBlackboard,
  onSaveScratchpad,
  onCreateTask,
  onUpdateTaskStatus,
  onClaimTask,
  onDeleteTask,
  onOpenHelp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredAgents = agents.filter((a) => {
    const q = searchQuery.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
  });

  const drawerWidth = activeTab === 'messages' ? 'w-80 md:w-[420px]' : 'w-72 md:w-80';

  return (
    <aside className={`${drawerWidth} bg-obsidian-900/95 backdrop-blur-xl border-r border-white/[0.08] flex flex-col h-full select-none shrink-0 font-sans z-30 shadow-2xl animate-in slide-in-from-left-4 duration-150`}>
      {/* 1. Header & Close Button */}
      <div className="px-3 py-2.5 border-b border-white/[0.07] flex items-center justify-between bg-obsidian-850">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-cyber-indigo flex items-center justify-center">
            <Layers className="w-2 h-2 text-white" />
          </div>
          <span className="font-bold text-xs tracking-wide text-slate-200">
            {activeTab === 'messages' ? 'SWARM GROUP CHAT' : 'PANEL'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              sound.playClick();
              onOpenNewAgent();
            }}
            title="Spawn New Agent"
            className="p-1 px-1.5 text-[11px] font-semibold flex items-center gap-1 bg-cyber-indigo/20 hover:bg-cyber-indigo/30 text-cyber-indigo rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Spawn</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            title="Close Drawer (Ctrl+B)"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Sleek Tab Bar Switcher */}
      <div className="flex items-center bg-obsidian-950 p-1 border-b border-white/[0.05] gap-0.5">
        <button
          onClick={() => {
            sound.playClick();
            onSelectTab('agents');
          }}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[11px] font-medium transition-all ${
            activeTab === 'agents'
              ? 'bg-obsidian-850 text-slate-100 font-semibold shadow-sm border border-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3 h-3 text-cyber-indigo" />
          <span>Agents</span>
          {agents.length > 0 && (
            <span className="px-1 bg-cyber-indigo/30 text-cyber-indigo text-[9px] font-mono rounded-full font-bold">
              {agents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onSelectTab('messages');
          }}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[11px] font-medium transition-all ${
            activeTab === 'messages'
              ? 'bg-obsidian-850 text-slate-100 font-semibold shadow-sm border border-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3 h-3 text-cyber-purple" />
          <span>Chat</span>
          {messages.length > 0 && (
            <span className="px-1 bg-cyber-purple/30 text-cyber-purple text-[9px] font-mono rounded-full font-bold">
              {messages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onSelectTab('swarms');
          }}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[11px] font-medium transition-all ${
            activeTab === 'swarms'
              ? 'bg-obsidian-850 text-slate-100 font-semibold shadow-sm border border-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-cyber-amber" />
          <span>Swarms</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onSelectTab('tasks');
          }}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[11px] font-medium transition-all ${
            activeTab === 'tasks'
              ? 'bg-obsidian-850 text-slate-100 font-semibold shadow-sm border border-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListTodo className="w-3 h-3 text-cyber-green" />
          <span>Tasks</span>
        </button>
      </div>

      {/* 3. Tab Body View */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* VIEW 1: AGENTS ROSTER */}
        {activeTab === 'agents' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-white/[0.05]">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter agents..."
                  className="w-full bg-obsidian-950 border border-white/[0.08] rounded px-2 pl-7 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-indigo"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredAgents.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs flex flex-col items-center">
                  <Terminal className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="mb-2">No agents active</p>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenNewAgent();
                    }}
                    className="px-3 py-1 bg-cyber-indigo/20 hover:bg-cyber-indigo/30 text-cyber-indigo rounded text-xs font-semibold"
                  >
                    + Spawn Agent
                  </button>
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = activeAgentId === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => {
                        sound.playClick();
                        onSelectAgent(agent.id);
                      }}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyber-indigo/20 border border-cyber-indigo/40 text-slate-100'
                          : 'hover:bg-white/[0.05] text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: agent.color || '#6366f1' }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            <span>{agent.name}</span>
                            <span className="text-[9px] font-mono text-slate-500 font-normal">
                              @{agent.id}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1">
                            <span>{agent.role}</span>
                            {agent.isolateWorktree && (
                              <span className="text-cyber-amber flex items-center gap-0.5">
                                <GitBranch className="w-2.5 h-2.5" />
                                <span>{agent.worktreeBranch}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playWarn();
                          onKillAgent(agent.id);
                        }}
                        title="Terminate Agent"
                        className="p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: SWARM TEMPLATES */}
        {activeTab === 'swarms' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-1 py-1">
              READY-TO-USE SWARMS
            </div>
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="p-2.5 bg-obsidian-950 border border-white/[0.08] hover:border-cyber-indigo/40 rounded-xl transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {preset.name}
                  </span>
                  <span className="text-[9px] font-mono text-cyber-indigo bg-cyber-indigo/10 px-1.5 py-0.2 rounded-full">
                    {preset.agents.length} Agents
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5 line-clamp-2">
                  {preset.description}
                </p>
                <button
                  onClick={() => {
                    sound.playSuccess();
                    onLaunchPreset(preset.id);
                  }}
                  className="w-full flex items-center justify-center gap-1 py-1.5 bg-obsidian-900 hover:bg-cyber-indigo/20 text-slate-200 hover:text-cyber-indigo border border-white/[0.08] rounded-lg text-xs font-semibold transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>1-Click Launch</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 3: LIVE GROUP CHAT ROOM */}
        {activeTab === 'messages' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <AgentGroupChat
              messages={messages}
              agents={agents}
              onSendMessage={onSendMessage}
              onClearMessages={onClearMessages}
            />
          </div>
        )}

        {/* VIEW 4: TASKS & SHARED MEMORY */}
        {activeTab === 'tasks' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <BlackboardView
              blackboard={blackboard}
              tasks={tasks}
              scratchpad={scratchpad}
              agents={agents}
              onSetBlackboard={onSetBlackboard}
              onDeleteBlackboard={onDeleteBlackboard}
              onSaveScratchpad={onSaveScratchpad}
              onCreateTask={onCreateTask}
              onUpdateTaskStatus={onUpdateTaskStatus}
              onClaimTask={onClaimTask}
              onDeleteTask={onDeleteTask}
            />
          </div>
        )}
      </div>

      {/* 4. Bottom Cross-Talk Guide Trigger */}
      <div className="p-2 border-t border-white/[0.06] bg-obsidian-950">
        <button
          onClick={() => {
            sound.playClick();
            onOpenHelp();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 bg-obsidian-900 hover:bg-obsidian-850 border border-white/[0.08] rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyber-indigo" />
            <span className="font-medium">Cross-Talk Cheat Sheet</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">guide</span>
        </button>
      </div>
    </aside>
  );
};
