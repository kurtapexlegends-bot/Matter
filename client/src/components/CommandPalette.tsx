import React, { useState, useEffect, useRef } from 'react';
import { AgentSessionInfo, SwarmPreset, LayoutMode, ActiveSideTab } from '../types.js';
import { sound } from '../utils/audio.js';
import { 
  Search, 
  Terminal, 
  Sparkles, 
  Plus, 
  LayoutGrid, 
  Columns, 
  Rows, 
  MessageSquare, 
  ListTodo, 
  Database, 
  FileText, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Radio, 
  CornerDownLeft,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentSessionInfo[];
  presets: SwarmPreset[];
  onOpenNewAgent: () => void;
  onOpenPresets: () => void;
  onLaunchPreset: (id: string) => void;
  onChangeLayout: (layout: LayoutMode) => void;
  onSelectSideTab: (tab: ActiveSideTab) => void;
  onKillAll: () => void;
  onToggleSound: () => void;
  isSoundEnabled: boolean;
  onFocusBroadcast: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Actions' | 'Layout' | 'Navigation' | 'Presets' | 'Terminals';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  agents,
  presets,
  onOpenNewAgent,
  onOpenPresets,
  onLaunchPreset,
  onChangeLayout,
  onSelectSideTab,
  onKillAll,
  onToggleSound,
  isSoundEnabled,
  onFocusBroadcast,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      sound.playClick();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build command list
  const commands: CommandItem[] = [
    {
      id: 'new-agent',
      title: 'Spawn New Agent Terminal',
      category: 'Actions',
      shortcut: 'Ctrl+N',
      icon: <Plus className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onClose();
        onOpenNewAgent();
      },
    },
    {
      id: 'open-presets',
      title: 'Browse Swarm Presets',
      category: 'Actions',
      shortcut: 'Ctrl+P',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onOpenPresets();
      },
    },
    {
      id: 'focus-broadcast',
      title: 'Broadcast Prompt to All Terminals',
      category: 'Actions',
      shortcut: 'Ctrl+Shift+X',
      icon: <Radio className="w-4 h-4 text-purple-400" />,
      action: () => {
        onClose();
        onFocusBroadcast();
      },
    },
    {
      id: 'toggle-sound',
      title: isSoundEnabled ? 'Disable Terminal Sound FX' : 'Enable Terminal Sound FX',
      category: 'Actions',
      icon: isSoundEnabled ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onToggleSound();
        onClose();
      },
    },
    // Layouts
    {
      id: 'layout-grid',
      title: 'Switch Layout: Adaptive Grid',
      category: 'Layout',
      icon: <LayoutGrid className="w-4 h-4 text-sky-400" />,
      action: () => {
        onChangeLayout('grid');
        onClose();
      },
    },
    {
      id: 'layout-vertical',
      title: 'Switch Layout: Vertical Columns',
      category: 'Layout',
      icon: <Columns className="w-4 h-4 text-sky-400" />,
      action: () => {
        onChangeLayout('vertical');
        onClose();
      },
    },
    {
      id: 'layout-horizontal',
      title: 'Switch Layout: Horizontal Rows',
      category: 'Layout',
      icon: <Rows className="w-4 h-4 text-sky-400" />,
      action: () => {
        onChangeLayout('horizontal');
        onClose();
      },
    },
    {
      id: 'layout-tabs',
      title: 'Switch Layout: Tabbed View',
      category: 'Layout',
      icon: <Terminal className="w-4 h-4 text-sky-400" />,
      action: () => {
        onChangeLayout('tabs');
        onClose();
      },
    },
    // Navigation
    {
      id: 'nav-bus',
      title: 'Open Inter-Agent Message Bus',
      category: 'Navigation',
      shortcut: 'Ctrl+B',
      icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onSelectSideTab('messages');
        onClose();
      },
    },
    {
      id: 'nav-tasks',
      title: 'Open Collaborative Task Board',
      category: 'Navigation',
      icon: <ListTodo className="w-4 h-4 text-amber-400" />,
      action: () => {
        onSelectSideTab('tasks');
        onClose();
      },
    },
    {
      id: 'nav-blackboard',
      title: 'Open Shared Blackboard Variables',
      category: 'Navigation',
      icon: <Database className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onSelectSideTab('blackboard');
        onClose();
      },
    },
    {
      id: 'nav-scratchpad',
      title: 'Open Shared Scratchpad Notes',
      category: 'Navigation',
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onSelectSideTab('scratchpad');
        onClose();
      },
    },
    // Presets
    ...presets.map((preset) => ({
      id: `preset-${preset.id}`,
      title: `Launch Preset: ${preset.name}`,
      category: 'Presets' as const,
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => {
        onLaunchPreset(preset.id);
        onClose();
      },
    })),
    // Active Terminals
    ...agents.map((agent) => ({
      id: `agent-${agent.id}`,
      title: `Terminal: ${agent.name} (${agent.role})`,
      category: 'Terminals' as const,
      icon: <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }} />,
      action: () => {
        onClose();
      },
    })),
    // Danger
    ...(agents.length > 0
      ? [
          {
            id: 'kill-all',
            title: 'Terminate All Running Agent Sessions',
            category: 'Actions' as const,
            icon: <Trash2 className="w-4 h-4 text-rose-400" />,
            action: () => {
              onKillAll();
              onClose();
            },
          },
        ]
      : []),
  ];

  const filtered = commands.filter((c) => {
    const q = query.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      sound.playClick();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      sound.playClick();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filtered[selectedIndex];
      if (chosen) {
        sound.playSuccess();
        chosen.action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-obsidian-900 border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden flex flex-col shadow-black/80 animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-obsidian-850">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, action, agent, or layout..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="px-1.5 py-0.5 bg-obsidian-950 border border-white/[0.1] rounded text-[10px] text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    sound.playSuccess();
                    cmd.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyber-indigo/15 text-slate-100 border border-cyber-indigo/30'
                      : 'text-slate-300 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">{cmd.icon}</div>
                    <span className="text-xs font-medium truncate font-sans">{cmd.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-obsidian-950/80 text-slate-400 border border-white/[0.06] rounded">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-obsidian-950 text-indigo-300 border border-indigo-500/20 rounded">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-obsidian-950 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <span className="px-1 bg-obsidian-850 rounded border border-white/[0.08]">↑</span>
            <span className="px-1 bg-obsidian-850 rounded border border-white/[0.08]">↓</span>
            <span>Select:</span>
            <span className="px-1 bg-obsidian-850 rounded border border-white/[0.08]">↵</span>
          </div>
          <span>Agent Harness v1.0</span>
        </div>
      </div>
    </div>
  );
};
