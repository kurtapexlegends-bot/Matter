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

  // If no agents are active -> Render sleek minimalist developer cockpit
  if (agents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#07090e] text-slate-100 select-none font-sans">
        <div className="max-w-xl w-full flex flex-col items-center text-center">
          {/* Brand Mark */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-indigo via-purple-600 to-cyber-cyan flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Terminal className="w-5 h-5 text-white" />
          </div>

          <h2 className="text-base font-semibold tracking-tight text-slate-200 font-sans mb-1">
            Matter Terminal Workspace
          </h2>
          <p className="text-xs text-slate-500 font-sans mb-6">
            Multi-agent terminal harness with isolated worktrees and live message bus.
          </p>

          {/* Quick Launch Command Bar */}
          <form
            onSubmit={handleQuickCmdSubmit}
            className="w-full flex items-center gap-2 mb-4 p-1.5 bg-[#0b0e15] border border-white/[0.1] rounded-xl shadow-xl shadow-black/60 focus-within:border-cyber-indigo/60 transition-all"
          >
            <div className="flex items-center gap-1.5 pl-3 text-cyber-indigo font-mono text-xs">
              <span className="text-cyber-indigo font-bold">❯_</span>
            </div>
            <input
              type="text"
              value={quickCmdInput}
              onChange={(e) => setQuickCmdInput(e.target.value)}
              placeholder="Launch shell or agent (e.g. powershell, claude, gemini)..."
              className="flex-1 bg-transparent px-2 py-1.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!quickCmdInput.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-cyber-indigo hover:bg-cyber-indigo/90 disabled:opacity-30 text-white rounded-lg text-xs font-mono transition-all shrink-0"
            >
              <span>Launch</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>

          {/* 1-Click Fast Launcher Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-8">
            {QUICK_AGENTS.map((qa) => (
              <button
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
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d1017] hover:bg-[#141824] border border-white/[0.08] hover:border-white/[0.18] rounded-lg text-xs text-slate-300 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: qa.color }} />
                <span className="font-mono text-[11px]">{qa.name}</span>
              </button>
            ))}

            {presets.length > 0 && (
              <button
                onClick={() => {
                  sound.playSuccess();
                  onLaunchPreset(presets[0].id);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyber-indigo/10 hover:bg-cyber-indigo/20 border border-cyber-indigo/30 rounded-lg text-xs text-cyber-indigo transition-all font-mono text-[11px]"
              >
                <Sparkles className="w-3 h-3" />
                <span>Pair Swarm</span>
              </button>
            )}
          </div>

          {/* Desktop Keyboard Hints */}
          <div className="flex items-center gap-4 text-[10px] text-slate-600 font-mono">
            <span><kbd className="px-1 py-0.2 bg-white/[0.04] border border-white/[0.08] rounded">⌘K</kbd> Palette</span>
            <span><kbd className="px-1 py-0.2 bg-white/[0.04] border border-white/[0.08] rounded">⌘N</kbd> New</span>
            <span><kbd className="px-1 py-0.2 bg-white/[0.04] border border-white/[0.08] rounded">⌘B</kbd> Drawer</span>
            <span><kbd className="px-1 py-0.2 bg-white/[0.04] border border-white/[0.08] rounded">⌘J</kbd> Prompt</span>
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
