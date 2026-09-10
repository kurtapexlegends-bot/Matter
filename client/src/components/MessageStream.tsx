import React, { useState } from 'react';
import { AgentMessage, AgentSessionInfo, MessageType } from '../types.js';
import { sound } from '../utils/audio.js';
import { 
  Send, 
  Search, 
  Trash2, 
  Radio, 
  MessageSquare, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  FileCode, 
  Users,
  Copy,
  Check,
  Terminal,
  CornerDownLeft
} from 'lucide-react';

interface MessageStreamProps {
  messages: AgentMessage[];
  agents: AgentSessionInfo[];
  onSendMessage: (recipientId: string, content: string, type: MessageType) => void;
  onClearMessages: () => void;
}

export const MessageStream: React.FC<MessageStreamProps> = ({
  messages,
  agents,
  onSendMessage,
  onClearMessages,
}) => {
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('all');
  const [selectedType, setSelectedType] = useState<MessageType>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredMessages = messages.filter((m) => {
    if (filterAgent !== 'all' && m.senderId !== filterAgent && m.recipientId !== filterAgent) {
      return false;
    }
    if (filterType !== 'all' && m.type !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.recipientId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;
    sound.playChirp();
    onSendMessage(selectedRecipient, inputContent.trim(), selectedType);
    setInputContent('');
  };

  const handleCopy = (id: string, text: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeBadge = (type: MessageType) => {
    switch (type) {
      case 'broadcast':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/30 px-1.5 py-0.5 rounded">
            <Radio className="w-2.5 h-2.5" />
            <span>BROADCAST</span>
          </span>
        );
      case 'contract':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 px-1.5 py-0.5 rounded">
            <FileCode className="w-2.5 h-2.5" />
            <span>CONTRACT</span>
          </span>
        );
      case 'task':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono bg-cyber-amber/15 text-cyber-amber border border-cyber-amber/30 px-1.5 py-0.5 rounded">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>TASK</span>
          </span>
        );
      case 'system':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono bg-slate-800/60 text-slate-400 border border-white/[0.08] px-1.5 py-0.5 rounded">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>SYSTEM</span>
          </span>
        );
      case 'event':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono bg-cyber-green/15 text-cyber-green border border-cyber-green/30 px-1.5 py-0.5 rounded">
            <Tag className="w-2.5 h-2.5" />
            <span>EVENT</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono bg-cyber-indigo/15 text-cyber-indigo border border-cyber-indigo/30 px-1.5 py-0.5 rounded">
            <MessageSquare className="w-2.5 h-2.5" />
            <span>CHAT</span>
          </span>
        );
    }
  };

  const getAgentColor = (agentId: string) => {
    if (agentId === 'user' || agentId === 'Supervisor') return '#6366f1';
    if (agentId === 'system') return '#94a3b8';
    const found = agents.find((a) => a.id === agentId);
    return found?.color || '#38bdf8';
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-900 border-l border-white/[0.08] w-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-3 border-b border-white/[0.08] bg-obsidian-850">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyber-indigo" />
            <span className="font-bold text-xs text-slate-100 font-sans">Inter-Agent Messages</span>
            <span className="px-1.5 py-0.2 bg-obsidian-950 text-slate-400 border border-white/[0.06] rounded-full text-[10px] font-mono">
              {messages.length}
            </span>
          </div>
          <button
            onClick={() => {
              sound.playWarn();
              onClearMessages();
            }}
            title="Clear Message Log"
            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter messages..."
              className="w-full bg-obsidian-950 border border-white/[0.08] rounded-md pl-8 pr-2.5 py-1.5 text-xs text-slate-200 font-sans focus:outline-none focus:border-cyber-indigo"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="flex-1 bg-obsidian-950 border border-white/[0.08] rounded px-2 py-1 text-[11px] text-slate-300 font-mono focus:outline-none"
            >
              <option value="all">All Senders</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-24 bg-obsidian-950 border border-white/[0.08] rounded px-2 py-1 text-[11px] text-slate-300 font-mono focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="chat">Chat</option>
              <option value="task">Task</option>
              <option value="contract">Contract</option>
              <option value="event">Event</option>
              <option value="broadcast">Broadcast</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-obsidian-950/60 font-sans">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
            <p className="font-medium text-slate-400">No messages in bus stream</p>
            <p className="text-[10px] text-slate-600 mt-1 max-w-[220px] font-mono">
              Use <span className="text-cyber-indigo">agent-bridge send</span> inside any terminal.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2.5 rounded-lg border text-xs transition-all relative group ${
                msg.type === 'system'
                  ? 'bg-obsidian-900/60 border-white/[0.06]'
                  : msg.type === 'broadcast'
                  ? 'bg-cyber-purple/[0.06] border-cyber-purple/20'
                  : 'bg-obsidian-850/90 border-white/[0.07] hover:border-white/[0.15]'
              }`}
            >
              {/* Top Header */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getAgentColor(msg.senderId) }}
                  />
                  <span className="font-semibold text-slate-200 truncate font-sans text-xs">
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">→</span>
                  <span className="text-[11px] text-cyber-indigo font-medium truncate font-mono">
                    {msg.recipientId === 'all' ? 'All' : `@${msg.recipientId}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {getTypeBadge(msg.type)}
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="text-slate-300 leading-relaxed break-words whitespace-pre-wrap font-sans text-[11.5px]">
                {msg.content}
              </div>

              {/* Copy button on hover */}
              <button
                onClick={() => handleCopy(msg.id, msg.content)}
                title="Copy message"
                className="absolute right-2 bottom-2 p-1 bg-obsidian-950 border border-white/[0.1] rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 transition-opacity"
              >
                {copiedId === msg.id ? <Check className="w-3 h-3 text-cyber-green" /> : <Copy className="w-3 h-3" />}
              </button>

              {/* Metadata JSON Preview if available */}
              {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                <pre className="mt-1.5 p-1.5 bg-obsidian-950 rounded text-[10px] text-slate-400 font-mono overflow-x-auto border border-white/[0.04]">
                  {JSON.stringify(msg.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>

      {/* Supervisor Message Input */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-obsidian-850 border-t border-white/[0.08]">
        <div className="flex items-center gap-2 mb-1.5 text-xs">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <span>To:</span>
          </div>
          <select
            value={selectedRecipient}
            onChange={(e) => setSelectedRecipient(e.target.value)}
            className="flex-1 bg-obsidian-950 border border-white/[0.08] rounded px-2 py-0.5 text-xs text-slate-200 font-sans focus:outline-none"
          >
            <option value="all">📢 Broadcast (All)</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                👤 {a.name} ({a.role})
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as MessageType)}
            className="w-24 bg-obsidian-950 border border-white/[0.08] rounded px-2 py-0.5 text-xs text-slate-200 font-mono focus:outline-none"
          >
            <option value="chat">Chat</option>
            <option value="task">Task</option>
            <option value="contract">Contract</option>
            <option value="event">Event</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="Send message as Supervisor..."
            className="flex-1 bg-obsidian-950 border border-white/[0.1] rounded-md px-3 py-1.5 text-xs text-slate-200 font-sans placeholder-slate-500 focus:outline-none focus:border-cyber-indigo"
          />
          <button
            type="submit"
            className="p-1.5 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white rounded-md transition-colors shrink-0 shadow-sm"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
