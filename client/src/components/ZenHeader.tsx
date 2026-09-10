import React, { useState, useEffect } from 'react';
import { AgentSessionInfo, LayoutMode } from '../types.js';
import { sound } from '../utils/audio.js';
import { 
  Plus, 
  X, 
  GripVertical, 
  LayoutGrid, 
  Columns, 
  Maximize2, 
  Minimize2,
  Minus,
  Square,
  Copy,
  Command, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  PanelLeft, 
  Zap, 
  Layers,
  Sparkles,
  GitBranch,
  MessageSquare
} from 'lucide-react';

interface ZenHeaderProps {
  agents: AgentSessionInfo[];
  activeAgentId: string | null;
  layout: LayoutMode;
  isSidebarOpen: boolean;
  isSoundEnabled: boolean;
  isAutoApproveAll: boolean;
  messageCount: number;
  onSelectAgent: (id: string) => void;
  onReorderAgents: (reordered: AgentSessionInfo[]) => void;
  onKillAgent: (id: string) => void;
  onOpenNewAgent: () => void;
  onOpenPresets: () => void;
  onOpenChat: () => void;
  onChangeLayout: (layout: LayoutMode) => void;
  onToggleSidebar: () => void;
  onToggleSound: () => void;
  onToggleAutoApproveAll: () => void;
  onOpenCommandPalette: () => void;
  onOpenHelp: () => void;
}

export const ZenHeader: React.FC<ZenHeaderProps> = ({
  agents,
  activeAgentId,
  layout,
  isSidebarOpen,
  isSoundEnabled,
  isAutoApproveAll,
  messageCount,
  onSelectAgent,
  onReorderAgents,
  onKillAgent,
  onOpenNewAgent,
  onOpenPresets,
  onOpenChat,
  onChangeLayout,
  onToggleSidebar,
  onToggleSound,
  onToggleAutoApproveAll,
  onOpenCommandPalette,
  onOpenHelp,
}) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isDesktopMaximized, setIsDesktopMaximized] = useState(false);

  // Detect Electron desktop environment
  const desktop = (typeof window !== 'undefined' && (window as any).matterDesktop) || null;

  useEffect(() => {
    if (!desktop) return;
    desktop.isMaximized?.().then?.((max: boolean) => setIsDesktopMaximized(max));
    const unsubscribe = desktop.onMaximizedChange?.((max: boolean) => setIsDesktopMaximized(max));
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [desktop]);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    sound.playClick();
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragOverIdx !== idx) setDragOverIdx(idx);
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

  return (
    <header className="h-[38px] px-2.5 bg-[#07090e] border-b border-white/[0.08] flex items-center justify-between select-none z-30 shrink-0 font-sans app-drag-region">
      {/* 1. Left: Brand, Sidebar Drawer Trigger, & Live Health Dot */}
      <div className="flex items-center gap-2 shrink-0 app-no-drag">
        <button
          onClick={() => {
            sound.playClick();
            onToggleSidebar();
          }}
          title="Toggle Activity Drawer (Ctrl+B)"
          className={`p-1 rounded-md transition-colors ${
            isSidebarOpen 
              ? 'text-cyber-indigo bg-cyber-indigo/15 border border-cyber-indigo/30' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
          }`}
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5 pr-2.5 border-r border-white/[0.08]">
          <div className="w-4 h-4 rounded-md bg-gradient-to-br from-cyber-indigo via-purple-500 to-cyber-cyan flex items-center justify-center shadow-sm shadow-indigo-500/40">
            <Layers className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="font-bold text-[11px] tracking-wider text-slate-100 font-mono">
            MATTER
          </span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded">
            v1.1
          </span>
        </div>
      </div>

      {/* 2. Center: Seamless Native-Feeling Drag & Drop Terminal Tabs */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar px-2 h-full app-no-drag">
        {agents.map((agent, idx) => {
          const isActive = activeAgentId === agent.id;
          const isDragging = draggedIdx === idx;
          const isDragOver = dragOverIdx === idx;

          return (
            <div
              key={agent.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              onClick={() => {
                sound.playClick();
                onSelectAgent(agent.id);
              }}
              className={`group relative flex items-center gap-1.5 h-[26px] px-2 rounded text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-obsidian-850 text-slate-100 border border-white/[0.12] shadow-sm font-medium'
                  : 'bg-transparent hover:bg-white/[0.04] text-slate-400 hover:text-slate-200'
              } ${isDragging ? 'opacity-30 scale-95' : ''} ${
                isDragOver ? 'border-l-2 border-l-cyber-indigo pl-2.5' : ''
              }`}
              title={`${agent.name} (${agent.role}) · Drag to reorder · Click to focus`}
            >
              <GripVertical className="w-2.5 h-2.5 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: agent.color || '#6366f1' }}
              />
              <span className="truncate max-w-[110px] text-[11px] font-mono">
                {agent.name}
              </span>

              {agent.isolateWorktree && (
                <span title={agent.worktreeBranch} className="text-cyber-amber shrink-0">
                  <GitBranch className="w-2.5 h-2.5" />
                </span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playWarn();
                  onKillAgent(agent.id);
                }}
                title="Close Terminal"
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.1] text-slate-500 hover:text-rose-400 transition-all ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Quick Add Terminal Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenNewAgent();
          }}
          title="Spawn Terminal (Ctrl+N)"
          className="p-1 px-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded transition-colors flex items-center gap-1 text-[11px]"
        >
          <Plus className="w-3.5 h-3.5 text-cyber-indigo" />
          <span className="hidden sm:inline font-medium">New</span>
        </button>

        {/* Presets Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenPresets();
          }}
          title="Swarm Presets (Ctrl+P)"
          className="p-1 px-1.5 text-slate-400 hover:text-cyber-amber hover:bg-white/[0.06] rounded transition-colors flex items-center gap-1 text-[11px]"
        >
          <Sparkles className="w-3 h-3 text-cyber-amber" />
          <span className="hidden md:inline font-medium">Swarms</span>
        </button>

        {/* Group Chat Button with Active Badge */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenChat();
          }}
          title="Open Swarm Group Chat Room"
          className="p-1 px-1.5 text-slate-400 hover:text-cyber-purple hover:bg-white/[0.06] rounded transition-colors flex items-center gap-1 text-[11px]"
        >
          <MessageSquare className="w-3 h-3 text-cyber-purple" />
          <span className="hidden sm:inline font-medium">Swarm Chat</span>
          {messageCount > 0 && (
            <span className="px-1 py-0.2 bg-cyber-purple/30 text-cyber-purple text-[9px] font-mono rounded-full font-bold">
              {messageCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Right: View Controls, Auto-Allow, Command Search, & Native Window Buttons */}
      <div className="flex items-center gap-1 shrink-0 app-no-drag">
        {/* Auto-Allow Watcher Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleAutoApproveAll();
          }}
          title={isAutoApproveAll ? 'Auto-Allow: Active (Answers Option 1 / Yes in <150ms)' : 'Auto-Allow: Disabled'}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
            isAutoApproveAll
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'bg-obsidian-900 text-slate-500 border border-white/[0.06]'
          }`}
        >
          <Zap className={`w-3 h-3 ${isAutoApproveAll ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
          <span className="hidden lg:inline">Auto-Allow</span>
        </button>

        {/* Layout Switcher (1x / 2x / Grid) */}
        <div className="flex items-center bg-obsidian-900 border border-white/[0.08] rounded p-0.5">
          <button
            onClick={() => {
              sound.playClick();
              onChangeLayout('tabs');
            }}
            title="Tabs Mode (1-Pane Focus)"
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              layout === 'tabs' ? 'bg-cyber-indigo/25 text-cyber-indigo font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1x
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onChangeLayout('vertical');
            }}
            title="Split Columns (2-Pane)"
            className={`p-1 rounded text-xs transition-colors ${
              layout === 'vertical' ? 'bg-cyber-indigo/25 text-cyber-indigo' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onChangeLayout('grid');
            }}
            title="Adaptive Grid Layout"
            className={`p-1 rounded text-xs transition-colors ${
              layout === 'grid' ? 'bg-cyber-indigo/25 text-cyber-indigo' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
          </button>
        </div>

        {/* Command Search */}
        <button
          onClick={onOpenCommandPalette}
          title="Command Palette (Ctrl+K)"
          className="flex items-center gap-1 px-1.5 py-0.5 bg-obsidian-900 hover:bg-obsidian-850 border border-white/[0.08] rounded text-slate-400 hover:text-slate-200 text-xs transition-all"
        >
          <Command className="w-3 h-3 text-slate-500" />
          <kbd className="text-[9px] font-mono text-slate-400">⌘K</kbd>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleSound}
          title={isSoundEnabled ? 'Disable Sound FX' : 'Enable Sound FX'}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded transition-colors"
        >
          {isSoundEnabled ? <Volume2 className="w-3 h-3 text-cyber-green" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
        </button>

        {/* Help Guide */}
        <button
          onClick={onOpenHelp}
          title="Cross-Talk & Conflict Prevention Guide"
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded transition-colors"
        >
          <HelpCircle className="w-3 h-3 text-cyber-indigo" />
        </button>

        {/* 4. Native Desktop Frameless Window Controls (Visible in Electron) */}
        {desktop?.isDesktop && (
          <div className="flex items-center ml-1 border-l border-white/[0.08] pl-1">
            <button
              onClick={() => desktop.minimize()}
              title="Minimize Window"
              className="h-6 w-7 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] rounded transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => desktop.maximize()}
              title={isDesktopMaximized ? 'Restore Window' : 'Maximize Window'}
              className="h-6 w-7 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] rounded transition-colors"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => desktop.close()}
              title="Close Matter"
              className="h-6 w-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
