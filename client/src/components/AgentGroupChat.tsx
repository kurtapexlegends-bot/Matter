import React, { useState, useRef, useEffect } from 'react';
import { AgentMessage, AgentSessionInfo, MessageType } from '../types.js';
import { sound } from '../utils/audio.js';
import { 
  Send, 
  Users, 
  Bot, 
  User, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Zap,
  Code,
  Sparkles,
  Terminal,
  CornerDownLeft
} from 'lucide-react';

interface AgentGroupChatProps {
  messages: AgentMessage[];
  agents: AgentSessionInfo[];
  onSendMessage: (recipientId: string, content: string, type: MessageType, pipeToTerminal?: boolean) => void;
  onClearMessages: () => void;
}

// Markdown & Code Block renderer
const FormattedMessageContent: React.FC<{ content: string; onCopy: (text: string) => void }> = ({ content, onCopy }) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  // Split content by code blocks: ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-xs leading-relaxed space-y-2 break-words font-sans">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : 'code';
          const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          const isCopied = copiedCodeIdx === idx;

          return (
            <div key={idx} className="my-2 rounded-lg bg-[#05070a] border border-white/[0.08] overflow-hidden text-left font-mono">
              <div className="flex items-center justify-between px-2.5 py-1 bg-white/[0.03] border-b border-white/[0.06] text-[10px] text-slate-400">
                <span className="flex items-center gap-1 font-semibold uppercase text-slate-300">
                  <Code className="w-3 h-3 text-cyber-cyan" />
                  {lang}
                </span>
                <button
                  onClick={() => {
                    onCopy(codeBody);
                    setCopiedCodeIdx(idx);
                    setTimeout(() => setCopiedCodeIdx(null), 2000);
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2.5 text-[11px] overflow-x-auto leading-normal text-slate-200 selection:bg-indigo-500/40">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // Normal text with inline code highlights
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {inlineParts.map((sub, sIdx) => {
              if (sub.startsWith('`') && sub.endsWith('`') && sub.length > 2) {
                return (
                  <code
                    key={sIdx}
                    className="px-1 py-0.5 mx-0.5 rounded bg-[#07090e] border border-white/[0.1] text-cyber-cyan font-mono text-[11px]"
                  >
                    {sub.slice(1, -1)}
                  </code>
                );
              }
              return sub;
            })}
          </span>
        );
      })}
    </div>
  );
};

export const AgentGroupChat: React.FC<AgentGroupChatProps> = ({
  messages,
  agents,
  onSendMessage,
  onClearMessages,
}) => {
  const [inputContent, setInputContent] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'agents' | 'system'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) return;

    sound.playBroadcast();
    onSendMessage(selectedRecipient, inputContent.trim(), 'chat', true);
    setInputContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickPrompt = (prompt: string) => {
    sound.playClick();
    setInputContent(prompt);
    textareaRef.current?.focus();
  };

  const filteredMessages = messages.filter((m) => {
    if (filterMode === 'agents') return m.senderId !== 'system' && m.senderId !== 'user';
    if (filterMode === 'system') return m.senderId === 'system' || m.type === 'system';
    return true;
  });

  const getAgentColor = (senderId: string) => {
    if (senderId === 'user' || senderId === 'Supervisor') return '#6366f1';
    if (senderId === 'system') return '#94a3b8';
    const found = agents.find((a) => a.id === senderId || a.name === senderId);
    return found?.color || '#06b6d4';
  };

  return (
    <div className="flex flex-col h-full bg-[#080a0f] border-l border-white/[0.08] w-full overflow-hidden select-none font-sans">
      {/* 1. Group Chat Header with Active Members */}
      <div className="px-3 py-2 bg-obsidian-900 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyber-indigo to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Users className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-100 font-mono tracking-tight">
                SWARM CHAT
              </span>
              <span className="px-1.5 py-0.2 bg-cyber-indigo/15 text-cyber-indigo border border-cyber-indigo/30 rounded text-[9px] font-mono font-bold">
                {agents.length + 1} online
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Live bidirectional communication with CLI agents
            </p>
          </div>
        </div>

        {/* Clear Button */}
        <button
          onClick={() => {
            sound.playWarn();
            onClearMessages();
          }}
          title="Clear Chat History"
          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Active Members Bar */}
      <div className="px-2.5 py-1 bg-obsidian-950/80 border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs shrink-0">
        <span className="text-[9px] font-mono text-slate-500 uppercase font-bold shrink-0">
          ROOM:
        </span>

        {/* User Avatar */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-cyber-indigo/10 border border-cyber-indigo/30 rounded text-[10px] font-medium text-slate-200 shrink-0">
          <User className="w-2.5 h-2.5 text-cyber-indigo" />
          <span>You</span>
        </div>

        {/* Active Agents */}
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => {
              sound.playClick();
              setSelectedRecipient(agent.id);
            }}
            title={`Direct message @${agent.name}`}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium transition-all shrink-0 ${
              selectedRecipient === agent.id
                ? 'bg-cyber-indigo/20 border-cyber-indigo text-slate-100'
                : 'bg-obsidian-900 border-white/[0.08] text-slate-300 hover:border-white/[0.2]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
            <span>{agent.name}</span>
          </button>
        ))}
      </div>

      {/* 3. Live Chat Message Stream */}
      <div ref={scrollRef} className="flex-1 p-2.5 overflow-y-auto space-y-2.5 font-sans">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Bot className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-300 mb-1">Swarm Room Active</p>
            <p className="text-[11px] max-w-xs text-slate-500 leading-relaxed mb-3">
              Prompts typed here automatically pipe to agent terminals, and agent responses stream back live.
            </p>
            <div className="flex flex-wrap gap-1 justify-center max-w-xs">
              <button
                onClick={() => handleQuickPrompt("What is your current status and active task?")}
                className="px-2 py-1 bg-obsidian-900 hover:bg-obsidian-850 border border-white/[0.08] rounded text-[10px] text-slate-300 transition-colors"
              >
                ⚡ Status check
              </button>
              <button
                onClick={() => handleQuickPrompt("Please inspect project files and coordinate next steps.")}
                className="px-2 py-1 bg-obsidian-900 hover:bg-obsidian-850 border border-white/[0.08] rounded text-[10px] text-slate-300 transition-colors"
              >
                🔍 Inspect project
              </button>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.senderId === 'user' || msg.senderName === 'Supervisor' || msg.senderName === 'You';
            const isSystem = msg.senderId === 'system' || msg.type === 'system';
            const senderColor = getAgentColor(msg.senderId);

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <div className="px-2 py-0.5 bg-obsidian-900/80 border border-white/[0.08] rounded text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-cyber-indigo" />
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar Icon */}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                  style={{ backgroundColor: `${senderColor}25`, border: `1px solid ${senderColor}50` }}
                >
                  {isUser ? (
                    <User className="w-3 h-3 text-cyber-indigo" />
                  ) : (
                    <Bot className="w-3 h-3" style={{ color: senderColor }} />
                  )}
                </div>

                {/* Message Card / Bubble */}
                <div
                  className={`max-w-[88%] rounded-xl p-2.5 shadow-md transition-all ${
                    isUser
                      ? 'bg-cyber-indigo/20 border border-cyber-indigo/40 text-slate-100 rounded-tr-none'
                      : 'bg-[#0d1017] border border-white/[0.09] text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Bubble Header */}
                  <div className="flex items-center gap-2 mb-1.5 text-[10px]">
                    <span className="font-bold text-slate-200" style={{ color: !isUser ? senderColor : undefined }}>
                      {isUser ? 'You' : msg.senderName}
                    </span>

                    {msg.recipientId && msg.recipientId !== 'all' ? (
                      <span className="flex items-center gap-0.5 text-slate-400 font-mono">
                        <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                        <span className="text-cyber-cyan">@{msg.recipientId}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-500 bg-obsidian-950 px-1 rounded">
                        @everyone
                      </span>
                    )}

                    <span className="text-slate-500 font-mono ml-auto text-[9px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Bubble Content with Code & Markdown Formatting */}
                  <FormattedMessageContent
                    content={msg.content}
                    onCopy={(text) => {
                      navigator.clipboard.writeText(text);
                      sound.playClick();
                    }}
                  />

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/[0.05] text-[10px] text-slate-500">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {!isUser && (
                      <button
                        onClick={() => {
                          setSelectedRecipient(msg.senderId);
                          setInputContent(`@${msg.senderName} `);
                          textareaRef.current?.focus();
                        }}
                        className="text-cyber-indigo hover:text-cyber-indigo/80 font-medium"
                      >
                        Reply @{msg.senderName}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Group Chat Composer */}
      <div className="p-2.5 bg-obsidian-900 border-t border-white/[0.08] shrink-0 font-sans">
        {/* Recipient Selector & Permanent Terminal Sync Indicator */}
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-mono">TO:</span>
            <select
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
              className="bg-obsidian-950 border border-white/[0.1] rounded px-1.5 py-0.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyber-indigo"
            >
              <option value="all">@ Everyone (Broadcast)</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  @{a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded shadow-sm">
            <Zap className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
            <span>Terminal Sync: Live</span>
          </div>
        </div>

        {/* Input Textarea & Send Button */}
        <form onSubmit={handleSend} className="relative flex items-center gap-1.5">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedRecipient === 'all'
                ? 'Prompt the swarm... (Enter to send, Shift+Enter for multiline)'
                : `Prompt @${agents.find((a) => a.id === selectedRecipient)?.name || selectedRecipient}...`
            }
            className="flex-1 bg-obsidian-950 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 font-sans focus:outline-none focus:border-cyber-indigo resize-none"
          />

          <button
            type="submit"
            disabled={!inputContent.trim()}
            className="px-3 py-2.5 bg-cyber-indigo hover:bg-cyber-indigo/90 disabled:opacity-40 text-white rounded-lg shadow-md transition-all shrink-0 flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
