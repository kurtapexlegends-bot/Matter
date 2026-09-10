import React, { useState } from 'react';
import { AgentSessionInfo, SwarmPreset } from '../types.js';
import { ActivityTab } from './ActivityBar.js';
import { sound } from '../utils/audio.js';
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  GitBranch, 
  Folder, 
  Terminal, 
  Search, 
  ChevronRight, 
  ChevronDown,
  Layers,
  Activity,
  Play,
  RotateCcw
} from 'lucide-react';

interface PrimarySidebarProps {
  activeTab: ActivityTab;
  agents: AgentSessionInfo[];
  presets: SwarmPreset[];
  activeAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onOpenNewAgent: () => void;
  onOpenPresets: () => void;
  onLaunchPreset: (id: string) => void;
  onKillAgent: (id: string) => void;
}

export const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
  activeTab,
  agents,
  presets,
  activeAgentId,
  onSelectAgent,
  onOpenNewAgent,
  onOpenPresets,
  onLaunchPreset,
  onKillAgent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAgentsCollapsed, setIsAgentsCollapsed] = useState(false);
  const [isPresetsCollapsed, setIsPresetsCollapsed] = useState(false);

  const filteredAgents = agents.filter((a) => {
    const q = searchQuery.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
  });

  return (
    <div className="w-60 md:w-64 bg-obsidian-900 border-r border-white/[0.07] flex flex-col h-full select-none shrink-0 font-sans">
      {/* Sidebar Header */}
      <div className="px-3 py-2.5 border-b border-white/[0.07] flex items-center justify-between bg-obsidian-850">
        <span className="font-bold text-xs uppercase tracking-wider text-slate-300 font-mono">
          {activeTab === 'swarms' ? 'SWARM TEMPLATES' : 'AGENT WORKSPACE'}
        </span>
        <button
          onClick={() => {
            sound.playClick();
            onOpenNewAgent();
          }}
          title="Spawn Terminal (Ctrl+N)"
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter / Search */}
      <div className="p-2 border-b border-white/[0.05]">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter agents..."
            className="w-full bg-obsidian-950 border border-white/[0.08] rounded px-2.5 pl-7 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyber-indigo font-sans"
          />
        </div>
      </div>

      {/* Sidebar Scroll Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* RUNNING AGENTS TREE */}
        <div>
          <button
            onClick={() => setIsAgentsCollapsed(!isAgentsCollapsed)}
            className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1.5 py-1 hover:text-slate-200"
          >
            <div className="flex items-center gap-1">
              {isAgentsCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>RUNNING AGENTS</span>
            </div>
            <span className="px-1.5 py-0.2 bg-obsidian-950 border border-white/[0.08] rounded-full text-[9px] text-slate-400">
              {agents.length}
            </span>
          </button>

          {!isAgentsCollapsed && (
            <div className="mt-1 space-y-0.5">
              {filteredAgents.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-[11px]">
                  <p className="mb-2">No agents active</p>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenNewAgent();
                    }}
                    className="px-2.5 py-1 bg-cyber-indigo/15 hover:bg-cyber-indigo/25 text-cyber-indigo border border-cyber-indigo/30 rounded text-[11px] font-medium transition-colors"
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
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyber-indigo/15 border border-cyber-indigo/30 text-slate-100'
                          : 'hover:bg-white/[0.04] text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: agent.color || '#6366f1' }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium font-sans truncate">{agent.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{agent.role}</div>
                        </div>
                      </div>

                      {/* Right Tags & Kill Action */}
                      <div className="flex items-center gap-1 shrink-0">
                        {agent.isolateWorktree && (
                          <span title={agent.worktreeBranch} className="text-cyber-amber">
                            <GitBranch className="w-3 h-3" />
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.playWarn();
                            onKillAgent(agent.id);
                          }}
                          title="Terminate process"
                          className="p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* PRESET SWARMS */}
        <div className="pt-2 border-t border-white/[0.05]">
          <button
            onClick={() => setIsPresetsCollapsed(!isPresetsCollapsed)}
            className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1.5 py-1 hover:text-slate-200"
          >
            <div className="flex items-center gap-1">
              {isPresetsCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>PRESET SWARMS</span>
            </div>
            <Sparkles className="w-3 h-3 text-cyber-amber" />
          </button>

          {!isPresetsCollapsed && (
            <div className="mt-1 space-y-1">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-2 bg-obsidian-950 border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-200 font-sans truncate">
                      {preset.name}
                    </span>
                    <span className="text-[9px] font-mono text-cyber-indigo bg-cyber-indigo/10 px-1 py-0.2 rounded">
                      {preset.agents.length}A
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight mb-2 line-clamp-2">
                    {preset.description}
                  </p>
                  <button
                    onClick={() => {
                      sound.playSuccess();
                      onLaunchPreset(preset.id);
                    }}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-obsidian-900 hover:bg-cyber-indigo/20 text-slate-200 hover:text-cyber-indigo border border-white/[0.08] rounded text-[10px] font-medium transition-colors"
                  >
                    <Play className="w-2.5 h-2.5" />
                    <span>Launch Swarm</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
