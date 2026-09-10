import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { AgentSessionInfo } from '../types.js';
import { sound } from '../utils/audio.js';
import { 
  Maximize2, 
  Minimize2, 
  Trash2, 
  X, 
  GitBranch, 
  Folder, 
  CornerDownLeft,
  Send,
  Copy,
  Check,
  Terminal as TermIcon,
  Activity
} from 'lucide-react';

interface TerminalPaneProps {
  agent: AgentSessionInfo;
  ws: WebSocket | null;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onKill: (id: string) => void;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({
  agent,
  ws,
  isMaximized,
  onToggleMaximize,
  onKill,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [showInputBar, setShowInputBar] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Terminal instance with modern dark minimalist theme
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 12.5,
      lineHeight: 1.25,
      fontFamily: 'JetBrains Mono, Fira Code, Cascadia Code, SF Mono, Menlo, monospace',
      theme: {
        background: '#07090e',
        foreground: '#e2e8f0',
        cursor: agent.color || '#6366f1',
        cursorAccent: '#07090e',
        selectionBackground: 'rgba(99, 102, 241, 0.35)',
        black: '#121927',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#fb7185',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#e879f9',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      allowTransparency: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Send initial size
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'pty:resize',
          agentId: agent.id,
          cols: term.cols,
          rows: term.rows,
        })
      );
      // Request initial history
      ws.send(
        JSON.stringify({
          type: 'pty:history',
          agentId: agent.id,
        })
      );
    }

    // Handle user keyboard input
    const onDataDisposable = term.onData((data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'pty:input',
            agentId: agent.id,
            data,
          })
        );
      }
    });

    // Handle ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (containerRef.current && containerRef.current.clientWidth > 0) {
          fitAddon.fit();
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'pty:resize',
                agentId: agent.id,
                cols: term.cols,
                rows: term.rows,
              })
            );
          }
        }
      } catch (e) {}
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      onDataDisposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
    };
  }, [agent.id]);

  // Listen to WebSocket messages
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'pty:data' && msg.payload.agentId === agent.id) {
          termRef.current?.write(msg.payload.data);
        } else if (msg.type === 'pty:history' && msg.payload.agentId === agent.id) {
          termRef.current?.write(msg.payload.history);
        }
      } catch (e) {}
    };

    ws.addEventListener('message', handleMessage);
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, agent.id]);

  // Fit terminal on maximize toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      fitAddonRef.current?.fit();
    }, 150);
    return () => clearTimeout(timer);
  }, [isMaximized]);

  const handleClear = () => {
    sound.playClick();
    termRef.current?.clear();
  };

  const handleCopyBuffer = () => {
    if (!termRef.current) return;
    sound.playClick();
    termRef.current.selectAll();
    const selection = termRef.current.getSelection();
    termRef.current.clearSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    sound.playClick();
    ws.send(
      JSON.stringify({
        type: 'pty:input',
        agentId: agent.id,
        data: quickInput + '\r',
      })
    );
    setQuickInput('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-cyber-green bg-cyber-green/10 border border-cyber-green/30 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
            <span>RUNNING</span>
          </span>
        );
      case 'busy':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-cyber-amber bg-cyber-amber/10 border border-cyber-amber/30 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-amber animate-pulse" />
            <span>BUSY</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-cyber-rose bg-cyber-rose/10 border border-cyber-rose/30 px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-rose" />
            <span>ERROR</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800/40 border border-white/[0.08] px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>IDLE</span>
          </span>
        );
    }
  };

  return (
    <div
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`flex flex-col h-full w-full terminal-window rounded-xl overflow-hidden transition-all duration-150 ${
        isFocused ? 'is-focused ring-1 ring-cyber-indigo/40' : ''
      }`}
    >
      {/* Sleek Single-Row Header (32px) */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-obsidian-900 border-b border-white/[0.08] select-none text-xs">
        {/* Left: Window Controls & Agent Info */}
        <div className="flex items-center gap-2 min-w-0">
          {/* macOS window dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onKill(agent.id)}
              title="Terminate process"
              className="w-2.5 h-2.5 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors"
            />
            <button
              onClick={handleClear}
              title="Clear terminal buffer"
              className="w-2.5 h-2.5 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors"
            />
            <button
              onClick={onToggleMaximize}
              title={isMaximized ? 'Restore window' : 'Maximize window'}
              className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
            />
          </div>

          {/* Agent Pill & Role */}
          <div className="flex items-center gap-1.5 min-w-0 pl-1 border-l border-white/[0.08]">
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: agent.color || '#6366f1' }}
            />
            <span 
              className="font-bold text-xs text-slate-100 font-sans tracking-tight truncate"
              title={`${agent.name} (PID: ${agent.pid || 'N/A'}, Dir: ${agent.cwd})`}
            >
              {agent.name}
            </span>

            <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06] rounded truncate">
              {agent.role}
            </span>

            {agent.isolateWorktree && agent.worktreeBranch && (
              <div className="hidden md:flex items-center gap-1 text-[9px] font-mono text-cyber-amber bg-cyber-amber/10 border border-cyber-amber/25 px-1.5 py-0.2 rounded">
                <GitBranch className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate max-w-[90px]">{agent.worktreeBranch}</span>
              </div>
            )}

            {getStatusBadge(agent.status)}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="hidden lg:inline text-[9px] font-mono text-slate-500 mr-1">
            PID: {agent.pid || 'N/A'}
          </span>

          <button
            onClick={() => {
              sound.playClick();
              setShowInputBar(!showInputBar);
            }}
            title="Quick Input Prompt"
            className={`p-1 rounded transition-colors ${
              showInputBar
                ? 'text-cyber-indigo bg-cyber-indigo/15 border border-cyber-indigo/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
            }`}
          >
            <Send className="w-3 h-3" />
          </button>

          <button
            onClick={handleCopyBuffer}
            title="Copy Terminal Output"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            {isCopied ? <Check className="w-3 h-3 text-cyber-green" /> : <Copy className="w-3 h-3" />}
          </button>

          <button
            onClick={handleClear}
            title="Clear Buffer"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleMaximize();
            }}
            title={isMaximized ? 'Restore View' : 'Maximize Pane'}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Quick Input Bar Drawer */}
      {showInputBar && (
        <form
          onSubmit={handleQuickSubmit}
          className="flex items-center gap-2 px-3 py-1.5 bg-obsidian-850 border-b border-white/[0.08] animate-in slide-in-from-top-2 duration-100"
        >
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder={`Inject command into ${agent.name} terminal...`}
            className="flex-1 bg-obsidian-950 border border-white/[0.1] rounded px-2.5 py-1 text-xs text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-cyber-indigo"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white rounded text-xs font-mono flex items-center gap-1 transition-colors"
          >
            <span>Send</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      )}

      {/* XTerm Viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full bg-[#07090e] overflow-hidden"
        onClick={() => termRef.current?.focus()}
      />
    </div>
  );
};
