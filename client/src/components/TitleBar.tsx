import React from 'react';
import { LayoutMode } from '../types.js';
import { sound } from '../utils/audio.js';
import { 
  Command, 
  LayoutGrid, 
  Columns, 
  Rows, 
  PanelLeft, 
  Volume2, 
  VolumeX, 
  Plus, 
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';

interface TitleBarProps {
  layout: LayoutMode;
  onChangeLayout: (layout: LayoutMode) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
  onOpenNewAgent: () => void;
  onOpenPresets: () => void;
  onOpenHelp: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  layout,
  onChangeLayout,
  isSidebarOpen,
  onToggleSidebar,
  onOpenCommandPalette,
  onOpenNewAgent,
  onOpenPresets,
  onOpenHelp,
  isSoundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="h-9 px-3 bg-obsidian-950/95 border-b border-white/[0.07] flex items-center justify-between select-none z-30 shrink-0 font-sans">
      {/* Left: Window Controls & App Brand */}
      <div className="flex items-center gap-3">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
        </div>

        {/* Matter Brand */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-cyber-indigo to-cyber-cyan flex items-center justify-center shadow-sm">
            <Layers className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="font-bold text-xs tracking-wider text-slate-100 font-sans">
            MATTER
          </span>
          <span className="hidden md:inline text-[10px] font-mono text-slate-500">
            v1.0
          </span>
        </div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleSidebar();
          }}
          title="Toggle Sidebar (Ctrl+B)"
          className={`p-1 rounded transition-colors ml-1 ${
            isSidebarOpen ? 'text-cyber-indigo bg-cyber-indigo/15' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
          }`}
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center: Quick Command Palette Trigger */}
      <div className="flex items-center justify-center flex-1 max-w-sm px-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-2.5 py-1 bg-obsidian-900/90 hover:bg-obsidian-850 border border-white/[0.08] hover:border-white/[0.16] rounded-md text-slate-400 hover:text-slate-200 transition-all text-xs"
        >
          <div className="flex items-center gap-2">
            <Command className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] font-sans">Search commands or agents...</span>
          </div>
          <kbd className="px-1.5 py-0.2 bg-obsidian-950 border border-white/[0.08] rounded text-[9px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions, Layout Switcher & Audio */}
      <div className="flex items-center gap-1.5">
        {/* Quick Launch Buttons */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenNewAgent();
          }}
          title="Spawn New Agent (Ctrl+N)"
          className="p-1 px-2 text-[11px] font-medium font-sans flex items-center gap-1 bg-cyber-indigo/15 hover:bg-cyber-indigo/25 text-cyber-indigo border border-cyber-indigo/30 rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">Spawn</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenPresets();
          }}
          title="Swarm Presets (Ctrl+P)"
          className="p-1 px-2 text-[11px] font-medium font-sans flex items-center gap-1 bg-obsidian-900 hover:bg-obsidian-850 text-cyber-amber border border-cyber-amber/30 rounded transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">Presets</span>
        </button>

        {/* Layout Switcher */}
        <div className="flex items-center bg-obsidian-900 border border-white/[0.08] rounded p-0.5 ml-1">
          <button
            onClick={() => {
              sound.playClick();
              onChangeLayout('grid');
            }}
            title="Grid Layout"
            className={`p-1 rounded text-xs transition-colors ${
              layout === 'grid' ? 'bg-cyber-indigo/25 text-cyber-indigo' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onChangeLayout('vertical');
            }}
            title="Vertical Split"
            className={`p-1 rounded text-xs transition-colors ${
              layout === 'vertical' ? 'bg-cyber-indigo/25 text-cyber-indigo' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onChangeLayout('horizontal');
            }}
            title="Horizontal Split"
            className={`p-1 rounded text-xs transition-colors ${
              layout === 'horizontal' ? 'bg-cyber-indigo/25 text-cyber-indigo' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rows className="w-3 h-3" />
          </button>
        </div>

        {/* Cross-Talk Guide & Sound Toggles */}
        <div className="flex items-center gap-1 pl-1 border-l border-white/[0.08]">
          <button
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }}
            title="How Agents Communicate (Guide)"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyber-indigo" />
          </button>

          <button
            onClick={() => {
              onToggleSound();
            }}
            title={isSoundEnabled ? 'Disable UI Sounds' : 'Enable UI Sounds'}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded transition-colors"
          >
            {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyber-green" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>
    </div>
  );
};
