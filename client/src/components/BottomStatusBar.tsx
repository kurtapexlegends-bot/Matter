import React from 'react';
import { LayoutMode } from '../types.js';
import { sound } from '../utils/audio.js';
import { 
  GitBranch, 
  Terminal, 
  Radio, 
  Volume2, 
  VolumeX, 
  Command,
  Activity,
  Layers
} from 'lucide-react';

interface BottomStatusBarProps {
  isConnected: boolean;
  agentCount: number;
  layout: LayoutMode;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onOpenCommandPalette: () => void;
  onFocusBroadcast: () => void;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  isConnected,
  agentCount,
  layout,
  isSoundEnabled,
  onToggleSound,
  onOpenCommandPalette,
  onFocusBroadcast,
}) => {
  return (
    <div className="h-6 px-3 bg-obsidian-950 border-t border-white/[0.07] flex items-center justify-between text-[10px] text-slate-400 font-mono select-none z-30 shrink-0">
      {/* Left Status Indicators */}
      <div className="flex items-center gap-3">
        {/* Live Daemon Status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-cyber-green shadow-sm shadow-cyber-green/50' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300 font-semibold">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {/* Running Agents Count */}
        <div className="flex items-center gap-1 text-slate-400 pl-2 border-l border-white/[0.06]">
          <Terminal className="w-2.5 h-2.5 text-cyber-indigo" />
          <span>{agentCount} {agentCount === 1 ? 'Terminal' : 'Terminals'}</span>
        </div>

        {/* Git Branch */}
        <div className="hidden sm:flex items-center gap-1 text-slate-400 pl-2 border-l border-white/[0.06]">
          <GitBranch className="w-2.5 h-2.5 text-cyber-amber" />
          <span>git:main</span>
        </div>

        {/* Layout */}
        <div className="hidden md:flex items-center gap-1 text-slate-500 pl-2 border-l border-white/[0.06] uppercase">
          <span>{layout}</span>
        </div>
      </div>

      {/* Right Desktop Helpers & Shortcuts */}
      <div className="flex items-center gap-3">
        {/* Quick Keyboard shortcuts */}
        <div className="hidden lg:flex items-center gap-3 text-slate-500">
          <button 
            onClick={onOpenCommandPalette} 
            className="hover:text-slate-300 transition-colors"
          >
            ⌘K Command
          </button>
          <span>·</span>
          <button 
            onClick={onFocusBroadcast} 
            className="hover:text-slate-300 transition-colors"
          >
            ⌘J Broadcast
          </button>
          <span>·</span>
          <span>UTF-8</span>
          <span>·</span>
          <span>PTY</span>
        </div>

        {/* Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          title={isSoundEnabled ? 'Disable UI Sounds' : 'Enable UI Sounds'}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors pl-2 border-l border-white/[0.06]"
        >
          {isSoundEnabled ? (
            <>
              <Volume2 className="w-2.5 h-2.5 text-cyber-green" />
              <span className="hidden sm:inline">Audio</span>
            </>
          ) : (
            <>
              <VolumeX className="w-2.5 h-2.5 text-slate-500" />
              <span className="hidden sm:inline">Muted</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
