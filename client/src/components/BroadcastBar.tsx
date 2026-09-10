import React, { useState, useRef, useEffect } from 'react';
import { AgentSessionInfo } from '../types.js';
import { sound } from '../utils/audio.js';
import { toast } from './Toast.js';
import { 
  Radio, 
  CheckSquare, 
  Square, 
  Zap, 
  CheckCircle2, 
  CornerDownLeft, 
  Ban, 
  ChevronUp, 
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface BroadcastBarProps {
  agents: AgentSessionInfo[];
  onBroadcast: (input: string, targetIds?: string[]) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const BroadcastBar: React.FC<BroadcastBarProps> = ({ 
  agents, 
  onBroadcast, 
  inputRef: externalRef 
}) => {
  const [input, setInput] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || localRef;

  const isAllSelected = selectedAgentIds.length === 0 || selectedAgentIds.length === agents.length;

  // Global shortcut: Ctrl+Shift+Y or Cmd+Shift+Y to auto-approve (Y) all terminals
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleApproveAll();
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

  // Instant 1-Click Action: Allow (Option 1: Yes, allow access)
  const handleAllowOption1 = () => {
    sound.playSuccess();
    const targetIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;
    onBroadcast('1\r', targetIds);
    toast.success('Allowed (Option 1)', `Sent '1' (Yes, allow access) to ${targetIds ? targetIds.length : 'all'} terminals.`);
  };

  // Instant 1-Click Action: Always Allow (Option 2: Persist to settings)
  const handleAlwaysAllowOption2 = () => {
    sound.playSuccess();
    const targetIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;
    onBroadcast('2\r', targetIds);
    toast.success('Always Allowed (Option 2)', `Sent '2' (Always allow non-workspace access) to ${targetIds ? targetIds.length : 'all'} terminals.`);
  };

  // Instant 1-Click Action: Approve (Y)
  const handleApproveAll = () => {
    sound.playSuccess();
    const targetIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;
    onBroadcast('y\r', targetIds);
    toast.success('Approved (Y) Sent', `Sent 'y' to ${targetIds ? targetIds.length : 'all'} terminals.`);
  };

  // Instant 1-Click Action: Send Enter
  const handleSendEnter = () => {
    sound.playClick();
    const targetIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;
    onBroadcast('\r', targetIds);
  };

  // Instant 1-Click Action: Cancel / Ctrl+C
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
    <div className="bg-obsidian-900 border-t border-white/[0.08] px-3 py-1.5 select-none shadow-2xl shrink-0 font-sans">
      {/* Target Selector Bar (if expanded) */}
      {isExpanded && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2 p-2 bg-obsidian-950 border border-white/[0.08] rounded-lg text-xs animate-in slide-in-from-bottom-1 duration-100">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-2 py-1 bg-obsidian-850 text-slate-200 hover:bg-obsidian-800 rounded transition-colors font-mono text-[11px]"
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
                    ? 'bg-cyber-indigo/15 border-cyber-indigo/40 text-slate-100'
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

      {/* Main Broadcast Input Form with Quick Action Buttons */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Target Badge */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 font-sans">
          <Radio className="w-3.5 h-3.5 text-cyber-purple animate-pulse" />
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setIsExpanded(!isExpanded);
            }}
            className="hover:text-slate-200 font-semibold text-slate-300 flex items-center gap-1 text-xs"
          >
            <span>Broadcast:</span>
            <span className="text-[10px] font-mono bg-obsidian-950 border border-white/[0.08] px-1.5 py-0.2 rounded text-cyber-indigo">
              {selectedAgentIds.length === 0 ? 'All' : `${selectedAgentIds.length} Agents`}
            </span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Broadcast command or prompt to terminals... (↑/↓ history, Ctrl+Shift+Y to approve all)"
            className="w-full bg-obsidian-950 border border-white/[0.1] rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-purple font-mono"
          />
        </div>

        {/* ⚡ Instant Action Triggers (Solves 'Allow access to this file', 'y/n', and command execution confirmation) */}
        <div className="flex items-center gap-1 shrink-0 font-sans">
          <button
            type="button"
            onClick={handleAllowOption1}
            title="Select Option 1: Yes, allow access / Yes to command (1 + Enter)"
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Allow (1 / Enter)</span>
          </button>

          <button
            type="button"
            onClick={handleAlwaysAllowOption2}
            title="Select Option 2: Yes, and always allow non-workspace access (Persists to settings so it never asks again!)"
            className="flex items-center gap-1 px-2 py-1 bg-cyber-cyan/15 hover:bg-cyber-cyan/25 text-cyber-cyan border border-cyber-cyan/30 rounded-lg text-xs font-medium transition-colors hidden sm:flex"
          >
            <Sparkles className="w-3 h-3" />
            <span>Always Allow (2)</span>
          </button>

          <button
            type="button"
            onClick={handleApproveAll}
            title="Send 'y' + Enter (Ctrl+Shift+Y)"
            className="flex items-center gap-1 px-2 py-1 bg-obsidian-850 hover:bg-obsidian-800 text-slate-300 border border-white/[0.08] rounded-lg text-xs font-medium transition-colors hidden md:flex"
          >
            <span>Y</span>
          </button>

          <button
            type="button"
            onClick={handleSendEnter}
            title="Send Enter (↵) to all terminals"
            className="flex items-center gap-1 px-2 py-1 bg-obsidian-850 hover:bg-obsidian-800 text-slate-300 border border-white/[0.08] rounded-lg text-xs font-medium transition-colors"
          >
            <CornerDownLeft className="w-3 h-3 text-slate-400" />
            <span className="hidden lg:inline">Enter</span>
          </button>

          <button
            type="button"
            onClick={handleCancelAll}
            title="Send Ctrl+C (SIGINT) to interrupt all terminals"
            className="flex items-center gap-1 px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <Ban className="w-3 h-3 text-rose-400" />
            <span className="hidden lg:inline">Cancel</span>
          </button>
        </div>

        {/* Execute Button */}
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0 font-sans"
        >
          <Zap className="w-3 h-3" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
