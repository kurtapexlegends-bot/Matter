import React, { useState } from 'react';
import { AgentSessionInfo, LayoutMode, SwarmPreset, AgentSessionConfig } from '../types.js';
import { ZenTerminalPane } from './ZenTerminalPane.js';
import { sound } from '../utils/audio.js';
import { 
  Plus, 
  X, 
  LayoutGrid, 
  Columns, 
  Rows, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Terminal, 
  Layers,
  GripVertical,
  GitBranch,
  Play,
  Bot,
  Zap,
  ArrowRight,
  Code,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface TerminalWorkspaceProps {
  agents: AgentSessionInfo[];
  presets: SwarmPreset[];
  ws: WebSocket | null;
  layout: LayoutMode;
  onChangeLayout: (layout: LayoutMode) => void;
  activeAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onReorderAgents: (reordered: AgentSessionInfo[]) => void;
  onKillAgent: (id: string) => void;
  onOpenNewAgent: () => void;
  onOpenPresets: () => void;
  onLaunchPreset: (presetId: string) => void;
  onSpawnQuickAgent: (config: AgentSessionConfig) => void;
}

const QUICK_AGENTS = [
  {
    name: 'Gemini CLI',
    role: 'Lead Developer',
    color: '#6366f1',
    shell: 'powershell.exe',
    desc: 'Autonomous coding, refactoring & architecture.',
    icon: <Bot className="w-4 h-4 text-cyber-indigo" />
  },
  {
    name: 'Claude Code',
    role: 'QA & Reviewer',
    color: '#ec4899',
    shell: 'powershell.exe',
    desc: 'Code review, test verification & debugging.',
    icon: <Code className="w-4 h-4 text-cyber-purple" />
  },
  {
    name: 'ChatGPT CLI',
    role: 'Fullstack Dev',
    color: '#10b981',
    shell: 'powershell.exe',
    desc: 'Rapid algorithm implementation & documentation.',
    icon: <Sparkles className="w-4 h-4 text-cyber-green" />
  },
  {
    name: 'Interactive Shell',
    role: 'System Terminal',
    color: '#06b6d4',
    shell: 'powershell.exe',
    desc: 'Direct PowerShell/Bash environment with agent-bridge.',
    icon: <Terminal className="w-4 h-4 text-cyber-cyan" />
  }
];

export const TerminalWorkspace: React.FC<TerminalWorkspaceProps> = ({
  agents,
  presets,
  ws,
  layout,
  onChangeLayout,
  activeAgentId,
  onSelectAgent,
  onReorderAgents,
  onKillAgent,
  onOpenNewAgent,
  onOpenPresets,
  onLaunchPreset,
  onSpawnQuickAgent,
}) => {
  const [maximizedId, setMaximizedId] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [quickCmdInput, setQuickCmdInput] = useState('');

  // If no active agent, default to first
  const currentActiveId = activeAgentId && agents.some((a) => a.id === activeAgentId)
    ? activeAgentId
    : agents[0]?.id || null;

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    sound.playClick();
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    sound.playClick();
    const updated = [...agents];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);

    onReorderAgents(updated);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleQuickCmdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCmdInput.trim()) return;
    const cmd = quickCmdInput.trim();
    onSpawnQuickAgent({
      id: `agent-${Date.now().toString(36).slice(-4)}`,
      name: cmd.split(' ')[0] || 'Terminal',
      role: 'CLI Agent',
      command: cmd,
      shell: 'powershell.exe',
    });
    setQuickCmdInput('');
  };

  // If no agents are active -> Render rich Matter Studio Hub
  if (agents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-10 bg-obsidian-950 text-slate-100 overflow-y-auto cyber-grid-bg select-none font-sans">
        <div className="max-w-4xl w-full flex flex-col items-center">
          {/* Header Brand */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-indigo via-cyber-purple to-cyber-cyan flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
                Matter Terminal Studio
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Isolated, multi-agent workspace with real-time inter-agent messaging and zero conflicts.
              </p>
            </div>
          </div>

          {/* Quick Launch Command Bar */}
          <form
            onSubmit={handleQuickCmdSubmit}
            className="w-full max-w-2xl flex items-center gap-2 my-6 p-1.5 bg-obsidian-900 border border-white/[0.12] rounded-xl shadow-xl shadow-black/50 focus-within:border-cyber-indigo/80 transition-all"
          >
            <div className="flex items-center gap-2 pl-3 text-slate-500 font-mono text-xs">
              <Terminal className="w-4 h-4 text-cyber-indigo" />
              <span>PS &gt;</span>
            </div>
            <input
              type="text"
              value={quickCmdInput}
              onChange={(e) => setQuickCmdInput(e.target.value)}
              placeholder="Type any command, CLI agent or shell (e.g. powershell, claude, gemini, python)..."
              className="flex-1 bg-transparent px-2 py-1.5 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!quickCmdInput.trim()}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-cyber-indigo hover:bg-cyber-indigo/90 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <span>Launch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Section 1: Quick Agent Spawn Tiles */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                1-CLICK AGENT LAUNCHERS
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenNewAgent();
                }}
                className="text-xs font-medium text-cyber-indigo hover:text-cyber-indigo/80 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Config</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_AGENTS.map((qa) => (
                <div
                  key={qa.name}
                  onClick={() => {
                    sound.playSuccess();
                    onSpawnQuickAgent({
                      id: `${qa.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).slice(-4)}`,
                      name: qa.name,
                      role: qa.role,
                      color: qa.color,
                      shell: qa.shell,
                    });
                  }}
                  className="p-3.5 bg-obsidian-900 border border-white/[0.08] hover:border-white/[0.18] rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: qa.color }} />
                        <span className="font-bold text-xs text-slate-100 font-sans">{qa.name}</span>
                      </div>
                      {qa.icon}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans mb-3">
                      {qa.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] font-mono text-slate-500 group-hover:text-cyber-indigo">
                    <span>{qa.role}</span>
                    <span className="flex items-center gap-0.5">
                      <span>Spawn</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Preset Swarms Gallery */}
          <div className="w-full mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                COORDINATED SWARM PRESETS
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenPresets();
                }}
                className="text-xs font-medium text-cyber-amber hover:text-cyber-amber/80 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Browse All</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    sound.playSuccess();
                    onLaunchPreset(preset.id);
                  }}
                  className="p-3.5 bg-obsidian-900 border border-white/[0.08] hover:border-cyber-indigo/40 rounded-xl cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-100 font-sans truncate">{preset.name}</span>
                      <span className="text-[9px] font-mono text-cyber-indigo bg-cyber-indigo/10 border border-cyber-indigo/30 px-1.5 py-0.2 rounded-full">
                        {preset.agents.length} AGENTS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans mb-3 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[10px] text-slate-400 group-hover:text-cyber-indigo font-medium font-sans">
                    <span>1-Click Deploy</span>
                    <Play className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Keyboard Shortcuts strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-500 font-mono pt-4 border-t border-white/[0.06]">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.2 bg-obsidian-900 border border-white/[0.1] rounded text-[10px]">⌘K</kbd> Command Palette
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.2 bg-obsidian-900 border border-white/[0.1] rounded text-[10px]">⌘N</kbd> Spawn Agent
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.2 bg-obsidian-900 border border-white/[0.1] rounded text-[10px]">⌘B</kbd> Toggle Sidebar
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.2 bg-obsidian-900 border border-white/[0.1] rounded text-[10px]">⌘J</kbd> Broadcast Prompt
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Maximized Single Pane
  if (maximizedId) {
    const maxAgent = agents.find((a) => a.id === maximizedId);
    if (maxAgent) {
      return (
        <div className="flex-1 bg-obsidian-950 overflow-hidden">
          <ZenTerminalPane
            agent={maxAgent}
            ws={ws}
            isMaximized={true}
            onToggleMaximize={() => {
              sound.playClick();
              setMaximizedId(null);
            }}
            onKill={onKillAgent}
          />
        </div>
      );
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-obsidian-950 overflow-hidden font-sans select-none">
      {/* Pure Full-Bleed Terminal Viewport */}
      <div className="flex-1 overflow-hidden">
        {layout === 'tabs' ? (
          // Tabs Mode: Single focused full-size agent
          (() => {
            const activeAgent = agents.find((a) => a.id === currentActiveId) || agents[0];
            return activeAgent ? (
              <ZenTerminalPane
                key={activeAgent.id}
                agent={activeAgent}
                ws={ws}
                isMaximized={false}
                onToggleMaximize={() => {
                  sound.playClick();
                  setMaximizedId(activeAgent.id);
                }}
                onKill={onKillAgent}
              />
            ) : null;
          })()
        ) : layout === 'vertical' ? (
          // Vertical Columns Split (Hairline divider)
          <div className="flex h-full overflow-x-auto divide-x divide-white/[0.08]">
            {agents.map((agent) => (
              <div key={agent.id} className="flex-1 min-w-[380px] h-full">
                <ZenTerminalPane
                  agent={agent}
                  ws={ws}
                  isMaximized={false}
                  onToggleMaximize={() => {
                    sound.playClick();
                    setMaximizedId(agent.id);
                  }}
                  onKill={onKillAgent}
                />
              </div>
            ))}
          </div>
        ) : layout === 'horizontal' ? (
          // Horizontal Rows Split (Hairline divider)
          <div className="flex flex-col h-full overflow-y-auto divide-y divide-white/[0.08]">
            {agents.map((agent) => (
              <div key={agent.id} className="flex-1 min-h-[260px] w-full">
                <ZenTerminalPane
                  agent={agent}
                  ws={ws}
                  isMaximized={false}
                  onToggleMaximize={() => {
                    sound.playClick();
                    setMaximizedId(agent.id);
                  }}
                  onKill={onKillAgent}
                />
              </div>
            ))}
          </div>
        ) : (
          // Responsive Adaptive Grid (Hairline dividers)
          <div
            className={`grid h-full divide-x divide-y divide-white/[0.08] ${
              agents.length === 1
                ? 'grid-cols-1 grid-rows-1'
                : agents.length === 2
                ? 'grid-cols-1 md:grid-cols-2 grid-rows-1'
                : agents.length === 3
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : agents.length === 4
                ? 'grid-cols-1 md:grid-cols-2 grid-rows-2'
                : 'grid-cols-1 md:grid-cols-2 auto-rows-fr overflow-y-auto'
            }`}
          >
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                className={`${agents.length > 4 ? 'min-h-[320px]' : 'h-full'} w-full overflow-hidden`}
              >
                <ZenTerminalPane
                  agent={agent}
                  ws={ws}
                  isMaximized={false}
                  onToggleMaximize={() => {
                    sound.playClick();
                    setMaximizedId(agent.id);
                  }}
                  onKill={onKillAgent}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
