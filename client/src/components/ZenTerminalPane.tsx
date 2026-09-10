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
  Copy, 
  Check, 
  GitBranch, 
  Zap,
  CheckCircle2
} from 'lucide-react';

interface ZenTerminalPaneProps {
  agent: AgentSessionInfo;
  ws: WebSocket | null;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onKill: (id: string) => void;
}

export const ZenTerminalPane: React.FC<ZenTerminalPaneProps> = ({
  agent,
  ws,
  isMaximized,
  onToggleMaximize,
  onKill,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Terminal instance with modern dark minimalist theme
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
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
      scrollback: 1000,
      fastScrollModifier: 'alt',
      windowsPty: {
        backend: 'conpty',
        buildNumber: 19041,
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Request terminal history
    fetch(`/api/agents/${agent.id}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history && data.history.length > 0) {
          data.history.forEach((chunk: string) => term.write(chunk));
        }
      })
      .catch(() => {});

    // Listen for terminal input
    const onDataDisposable = term.onData((inputData) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'pty:input',
            agentId: agent.id,
            data: inputData,
          })
        );
      }
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        if (ws && ws.readyState === WebSocket.OPEN && term.cols && term.rows) {
          ws.send(
            JSON.stringify({
              type: 'pty:resize',
              agentId: agent.id,
              cols: term.cols,
              rows: term.rows,
            })
          );
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

  // Handle incoming WebSocket PTY data
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'pty:data' && msg.payload.agentId === agent.id) {
          termRef.current?.write(msg.payload.data);
        }
      } catch (e) {}
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, agent.id]);

  const handleClear = () => {
    sound.playClick();
    termRef.current?.clear();
  };

  const handleCopyBuffer = () => {
    sound.playClick();
    if (!termRef.current) return;
    const term = termRef.current;
    let fullText = '';
    const buffer = term.buffer.active;
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) fullText += line.translateToString(true) + '\n';
    }
    navigator.clipboard.writeText(fullText.trimEnd());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`relative group flex flex-col h-full w-full bg-[#07090e] overflow-hidden transition-all duration-150 border border-white/[0.08] ${
        isFocused ? 'ring-1 ring-cyber-indigo/50' : ''
      }`}
    >
      {/* Floating Hover Micro-Toolbar (Appears in top-right corner on hover/focus) */}
      <div className="absolute top-2 right-3 z-20 flex items-center gap-1.5 p-1 bg-obsidian-900/90 hover:bg-obsidian-900 backdrop-blur-md border border-white/[0.1] rounded-lg shadow-xl opacity-40 group-hover:opacity-100 transition-opacity duration-150 text-xs select-none">
        {/* Agent Name Tag */}
        <div className="flex items-center gap-1.5 px-1.5 py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: agent.color || '#6366f1' }}
          />
          <span className="font-semibold text-[11px] text-slate-200 font-sans truncate max-w-[120px]">
            {agent.name}
          </span>
          {agent.isolateWorktree && (
            <span title={agent.worktreeBranch} className="text-cyber-amber">
              <GitBranch className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 pl-1 border-l border-white/[0.08]">
          <button
            onClick={handleCopyBuffer}
            title="Copy Terminal Text"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            {isCopied ? <Check className="w-3 h-3 text-cyber-green" /> : <Copy className="w-3 h-3" />}
          </button>

          <button
            onClick={handleClear}
            title="Clear Buffer"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleMaximize();
            }}
            title={isMaximized ? 'Restore View' : 'Maximize Pane'}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          <button
            onClick={() => {
              sound.playWarn();
              onKill(agent.id);
            }}
            title="Kill Terminal"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport (100% Height & Width) */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full h-full p-2.5 overflow-hidden" 
      />
    </div>
  );
};
