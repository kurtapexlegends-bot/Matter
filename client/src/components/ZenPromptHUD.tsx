import React, { useState, useRef, useEffect } from 'react';
import { AgentSessionInfo } from '../types.js';
import { sound } from '../utils/audio.js';
import { toast } from './Toast.js';
import { 
  Radio, 
  CheckCircle2, 
  Sparkles, 
  CornerDownLeft, 
  Ban, 
  Zap, 
  ChevronUp, 
  ChevronDown,
  Terminal,
  CheckSquare,
  Square
} from 'lucide-react';

interface ZenPromptHUDProps {
  agents: AgentSessionInfo[];
  onBroadcast: (input: string, targetIds?: string[]) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const ZenPromptHUD: React.FC<ZenPromptHUDProps> = ({
  agents,
  onBroadcast,
  inputRef: externalRef,
}) => {
  const [input, setInput] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || localRef;

  const isAllSelected = selectedAgentIds.length === 0 || selectedAgentIds.length === agents.length;

  // Global hotkeys
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ctrl+Shift+Y: Auto-Approve Option 1
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleAllowOption1();
      }
      // Ctrl+J: Focus prompt
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [agents, selectedAgentIds]);

  const toggleAgent = (id: string) => {
    sound.playClick();
    if (selectedAgentIds.includes(id)) {
      setSelectedAgentIds(selectedAgentIds.filter((item) => item !== id));
    } else {
      setSelectedAgentIds([...selectedAgentIds, id]);
    }
  };

  const handleSelectAll = () => {
    sound.playClick();
    if (isAllSelected && selectedAgentIds.length > 0) {
      setSelectedAgentIds([]);
    } else {
      setSelectedAgentIds(agents.map((a) => a.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || agents.length === 0) return;

    sound.playBroadcast();
    const targetIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;
    onBroadcast(input.trim(), targetIds);

    setHistory((prev) => [input.trim(), ...prev.filter((h) => h !== input.trim()).slice(0, 19)]);
    setHistoryIdx(-1);
    setInput('');
  };

  // Instant Action: Allow (Option 1 / Enter)
  const handleAllowOption1 = () => {
    sound.playSuccess();
    const targetIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;
    onBroadcast('1\r', targetIds);
    toast.success('Allowed (Option 1)', `Sent '1' (Yes, allow access) to ${targetIds ? targetIds.length : 'all'} terminals.`);
  };

  // Instant Action: Always Allow (Option 2)
  const handleAlwaysAllowOption2 = () => {
    sound.playSuccess();
    const targetIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;
    onBroadcast('2\r', targetIds);
    toast.success('Always Allowed (Option 2)', `Sent '2' (Always allow non-workspace access) to ${targetIds ? targetIds.length : 'all'} terminals.`);
  };

  // Instant Action: Send Enter
  const handleSendEnter = () => {
    sound.playClick();
    const targetIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;
    onBroadcast('\r', targetIds);
  };

  // Instant Action: Cancel / Ctrl+C
  const handleCancelAll = () => {
    sound.playWarn();
    const targetIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;
    onBroadcast('\x03', targetIds);
    toast.info('Interrupt Sent', 'Sent Ctrl+C to terminals.');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
        sound.playClick();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
        sound.playClick();
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  if (agents.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-3xl w-[94%] select-none font-sans">
      <div className="bg-obsidian-900/90 backdrop-blur-xl border border-white/[0.12] p-1.5 rounded-2xl shadow-2xl shadow-black/80 flex flex-col gap-1.5 transition-all">
        {/* Target Chips (if expanded) */}
        {isExpanded && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-obsidian-950/80 rounded-xl border border-white/[0.06] text-xs">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-2 py-1 bg-obsidian-850 text-slate-200 hover:bg-obsidian-800 rounded font-mono text-[11px]"
            >
              {isAllSelected ? <CheckSquare className="w-3.5 h-3.5 text-cyber-indigo" /> : <Square className="w-3.5 h-3.5" />}
              <span>All Terminals</span>
            </button>
            {agents.map((agent) => {
              const isSelected = selectedAgentIds.includes(agent.id) || selectedAgentIds.length === 0;
              return (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-sans transition-colors ${
                    isSelected
                      ? 'bg-cyber-indigo/20 border-cyber-indigo/40 text-slate-100'
                      : 'bg-obsidian-900 border-white/[0.06] text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                  <span>{agent.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Input Bar & Action Chips */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          {/* Target Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-obsidian-950/80 hover:bg-obsidian-850 border border-white/[0.08] rounded-xl text-slate-300 hover:text-slate-100 text-xs font-semibold shrink-0"
          >
            <Radio className="w-3 h-3 text-cyber-purple animate-pulse" />
            <span className="text-[11px]">
              {selectedAgentIds.length === 0 ? 'Broadcast' : `${selectedAgentIds.length} Agents`}
            </span>
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type prompt or command... (⌘J to focus, ↑/↓ history)"
            className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none"
          />

          {/* Quick Action Chips */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleAllowOption1}
              title="Select Option 1: Yes, allow access / Yes to command (1 + Enter)"
              className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-semibold transition-all"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Allow (1)</span>
            </button>

            <button
              type="button"
              onClick={handleAlwaysAllowOption2}
              title="Select Option 2: Always allow non-workspace access (Persists to settings)"
              className="flex items-center gap-1 px-2 py-1 bg-cyber-cyan/15 hover:bg-cyber-cyan/25 text-cyber-cyan border border-cyber-cyan/30 rounded-xl text-[11px] font-medium transition-colors hidden sm:flex"
            >
              <Sparkles className="w-3 h-3" />
              <span>Always (2)</span>
            </button>

            <button
              type="button"
              onClick={handleSendEnter}
              title="Send Enter (↵)"
              className="p-1 px-2 bg-obsidian-950 hover:bg-obsidian-850 text-slate-300 border border-white/[0.08] rounded-xl text-xs font-medium transition-colors"
            >
              <CornerDownLeft className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={handleCancelAll}
              title="Send Ctrl+C"
              className="p-1 px-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors"
            >
              <Ban className="w-3 h-3" />
            </button>

            <button
              type="submit"
              disabled={!input.trim()}
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Zap className="w-3 h-3" />
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
