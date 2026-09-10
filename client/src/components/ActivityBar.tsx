import React from 'react';
import { sound } from '../utils/audio.js';
import { 
  Terminal, 
  Sparkles, 
  MessageSquare, 
  ListTodo, 
  FileText, 
  Radio, 
  Command, 
  Settings,
  Zap,
  Activity
} from 'lucide-react';

export type ActivityTab = 'terminals' | 'swarms' | 'bus' | 'tasks' | 'notes';

interface ActivityBarProps {
  activeTab: ActivityTab;
  onSelectTab: (tab: ActivityTab) => void;
  terminalCount: number;
  messageCount: number;
  taskCount: number;
  isConnected: boolean;
  onOpenCommandPalette: () => void;
  onFocusBroadcast: () => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeTab,
  onSelectTab,
  terminalCount,
  messageCount,
  taskCount,
  isConnected,
  onOpenCommandPalette,
  onFocusBroadcast,
}) => {
  const navItems = [
    {
      id: 'terminals' as ActivityTab,
      label: 'Agent Terminals',
      icon: <Terminal className="w-4 h-4" />,
      badge: terminalCount > 0 ? terminalCount : undefined,
    },
    {
      id: 'swarms' as ActivityTab,
      label: 'Preset Swarms',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'bus' as ActivityTab,
      label: 'Inter-Agent Bus',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: messageCount > 0 ? messageCount : undefined,
    },
    {
      id: 'tasks' as ActivityTab,
      label: 'Tasks & Memory',
      icon: <ListTodo className="w-4 h-4" />,
      badge: taskCount > 0 ? taskCount : undefined,
    },
    {
      id: 'notes' as ActivityTab,
      label: 'Shared Notes',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-12 bg-obsidian-950 border-r border-white/[0.07] flex flex-col items-center justify-between py-2 select-none z-20 shrink-0">
      {/* Top Nav Icons */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sound.playClick();
                onSelectTab(item.id);
              }}
              title={item.label}
              className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-cyber-indigo/20 text-cyber-indigo shadow-sm after:absolute after:left-0 after:top-2 after:bottom-2 after:w-0.5 after:bg-cyber-indigo after:rounded-r'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              {item.icon}
              {item.badge !== undefined && (
                <span className="absolute top-1 right-1 px-1 min-w-[14px] h-3.5 bg-cyber-indigo text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Utility Icons */}
      <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-white/[0.06]">
        <button
          onClick={() => {
            sound.playClick();
            onFocusBroadcast();
          }}
          title="Broadcast Prompt (Ctrl+J)"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyber-purple hover:bg-white/[0.05] transition-colors"
        >
          <Zap className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenCommandPalette();
          }}
          title="Command Palette (Ctrl+K)"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Live Status Indicator */}
        <div
          title={isConnected ? 'Connected to Matter daemon' : 'Disconnected'}
          className="w-9 h-6 flex items-center justify-center"
        >
          <span className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-cyber-green' : 'bg-rose-500'
              }`}
            />
          </span>
        </div>
      </div>
    </div>
  );
};
