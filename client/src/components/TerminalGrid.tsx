import React, { useState } from 'react';
import { AgentSessionInfo, LayoutMode } from '../types.js';
import { TerminalPane } from './TerminalPane.js';
import { sound } from '../utils/audio.js';
import { 
  Plus, 
  Sparkles, 
  LayoutGrid, 
  Columns, 
  Rows, 
  FolderGit2,
  Terminal,
  Bot,
  Radio,
  Cpu,
  Command,
  ArrowRight
} from 'lucide-react';

interface TerminalGridProps {
  agents: AgentSessionInfo[];
  ws: WebSocket | null;
  layout: LayoutMode;
  onChangeLayout: (layout: LayoutMode) => void;
  onKillAgent: (id: string) => void;
  onOpenNewAgentModal: () => void;
  onOpenPresetModal: () => void;
}

export const TerminalGrid: React.FC<TerminalGridProps> = ({
  agents,
  ws,
  layout,
  onChangeLayout,
  onKillAgent,
  onOpenNewAgentModal,
  onOpenPresetModal,
}) => {
  const [maximizedId, setMaximizedId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // If active tab not set or removed, default to first agent
  const currentTabId = activeTabId && agents.some((a) => a.id === activeTabId)
    ? activeTabId
    : agents[0]?.id || null;

  if (agents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center cyber-grid-bg select-none overflow-y-auto">
        <div className="max-w-2xl w-full flex flex-col items-center">
          {/* Glowing Minimalist Badge */}
          <div className="w-14 h-14 rounded-2xl bg-obsidian-900 border border-cyber-indigo/30 flex items-center justify-center mb-5 shadow-glow-indigo">
            <Terminal className="w-7 h-7 text-cyber-indigo" />
          </div>

          <h2 className="text-xl font-bold text-slate-100 mb-2 font-sans tracking-tight">
            Agent Harness Terminal Workspace
          </h2>
          <p className="text-slate-400 max-w-md mb-6 text-xs leading-relaxed font-sans">
            Run multiple isolated CLI agents with zero file contention, live inter-agent messaging, and unified orchestration.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button
              onClick={() => {
                sound.playClick();
                onOpenNewAgentModal();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white text-xs font-semibold rounded-lg shadow-glow-indigo transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Spawn Terminal (Ctrl+N)</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onOpenPresetModal();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-obsidian-900 hover:bg-obsidian-850 text-slate-200 border border-white/[0.1] text-xs font-semibold rounded-lg transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-cyber-amber" />
              <span>Preset Swarms (Ctrl+P)</span>
            </button>
          </div>

          {/* Minimalist Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full text-left">
            <div className="p-3.5 bg-obsidian-900/80 border border-white/[0.08] rounded-xl hover:border-cyber-indigo/40 transition-all group">
              <div className="flex items-center gap-2 text-cyber-indigo font-semibold text-xs mb-1.5 font-sans">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Git Worktree Sandboxes</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Isolate agent workspaces on independent Git branches to eliminate file lock collisions.
              </p>
            </div>

            <div className="p-3.5 bg-obsidian-900/80 border border-white/[0.08] rounded-xl hover:border-cyber-green/40 transition-all group">
              <div className="flex items-center gap-2 text-cyber-green font-semibold text-xs mb-1.5 font-sans">
                <Radio className="w-3.5 h-3.5" />
                <span>Inter-Agent CLI Bus</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Direct and broadcast messaging via injected <code className="text-cyber-green font-mono">agent-bridge</code> CLI tool.
              </p>
            </div>

            <div className="p-3.5 bg-obsidian-900/80 border border-white/[0.08] rounded-xl hover:border-cyber-amber/40 transition-all group">
              <div className="flex items-center gap-2 text-cyber-amber font-semibold text-xs mb-1.5 font-sans">
                <Cpu className="w-3.5 h-3.5" />
                <span>Shared Blackboard & Tasks</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Live shared key-value memory, Kanban task queue, and collaborative scratchpad.
              </p>
            </div>
          </div>

          {/* Quick Keyboard Reference */}
          <div className="mt-8 flex items-center gap-4 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-obsidian-900 border border-white/[0.1] rounded text-[10px]">Ctrl+K</kbd> Command Palette
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-obsidian-900 border border-white/[0.1] rounded text-[10px]">Ctrl+B</kbd> Toggle Bus
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Handle single maximized agent view
  if (maximizedId) {
    const maxAgent = agents.find((a) => a.id === maximizedId);
    if (maxAgent) {
      return (
        <div className="flex-1 p-2 bg-obsidian-950 overflow-hidden">
          <TerminalPane
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
    <div className="flex-1 flex flex-col h-full bg-obsidian-950 overflow-hidden">
      {/* Top Layout Control Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-obsidian-900/90 border-b border-white/[0.08] select-none shrink-0">
        {/* Left: Tab list if in tabs mode or breadcrumbs */}
        {layout === 'tabs' ? (
          <div className="flex items-center gap-1 overflow-x-auto">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTabId(agent.id);
                }}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  currentTabId === agent.id
                    ? 'bg-obsidian-800 text-slate-100 border border-white/[0.12] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: agent.color || '#6366f1' }}
                />
                <span className="truncate max-w-[120px] font-sans">{agent.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
            <span>
              {agents.length} {agents.length === 1 ? 'Terminal Active' : 'Terminals Active'}
            </span>
          </div>
        )}

        {/* Right: Layout Switcher & Quick Add */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-obsidian-950 border border-white/[0.08] rounded-lg p-0.5">
            <button
              onClick={() => {
                sound.playClick();
                onChangeLayout('grid');
              }}
              title="Adaptive Grid (Auto 1x1, 1x2, 2x2)"
              className={`p-1.5 rounded text-xs transition-colors ${
                layout === 'grid' ? 'bg-cyber-indigo/20 text-cyber-indigo font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onChangeLayout('vertical');
              }}
              title="Vertical Columns Split"
              className={`p-1.5 rounded text-xs transition-colors ${
                layout === 'vertical' ? 'bg-cyber-indigo/20 text-cyber-indigo font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onChangeLayout('horizontal');
              }}
              title="Horizontal Rows Split"
              className={`p-1.5 rounded text-xs transition-colors ${
                layout === 'horizontal' ? 'bg-cyber-indigo/20 text-cyber-indigo font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Rows className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onChangeLayout('tabs');
              }}
              title="Tabbed Terminal View"
              className={`px-2.5 py-1 rounded text-[11px] font-medium font-mono transition-colors ${
                layout === 'tabs' ? 'bg-cyber-indigo/20 text-cyber-indigo font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tabs
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenNewAgentModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Agent</span>
          </button>
        </div>
      </div>

      {/* Dynamic Terminal Viewport */}
      <div className="flex-1 p-2 overflow-hidden">
        {layout === 'tabs' ? (
          (() => {
            const activeAgent = agents.find((a) => a.id === currentTabId) || agents[0];
            return activeAgent ? (
              <TerminalPane
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
          <div className="grid grid-flow-col auto-cols-fr gap-2 h-full">
            {agents.map((agent) => (
              <TerminalPane
                key={agent.id}
                agent={agent}
                ws={ws}
                isMaximized={false}
                onToggleMaximize={() => {
                  sound.playClick();
                  setMaximizedId(agent.id);
                }}
                onKill={onKillAgent}
              />
            ))}
          </div>
        ) : layout === 'horizontal' ? (
          <div className="grid grid-flow-row auto-rows-fr gap-2 h-full">
            {agents.map((agent) => (
              <TerminalPane
                key={agent.id}
                agent={agent}
                ws={ws}
                isMaximized={false}
                onToggleMaximize={() => {
                  sound.playClick();
                  setMaximizedId(agent.id);
                }}
                onKill={onKillAgent}
              />
            ))}
          </div>
        ) : (
          <div
            className={`grid gap-2 h-full ${
              agents.length === 1
                ? 'grid-cols-1 grid-rows-1'
                : agents.length === 2
                ? 'grid-cols-1 md:grid-cols-2 grid-rows-1'
                : agents.length === 3
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : agents.length === 4
                ? 'grid-cols-1 md:grid-cols-2 grid-rows-2'
                : 'grid-cols-1 md:grid-cols-3 grid-rows-2'
            }`}
          >
            {agents.map((agent) => (
              <TerminalPane
                key={agent.id}
                agent={agent}
                ws={ws}
                isMaximized={false}
                onToggleMaximize={() => {
                  sound.playClick();
                  setMaximizedId(agent.id);
                }}
                onKill={onKillAgent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
