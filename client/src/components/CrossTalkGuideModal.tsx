import React from 'react';
import { sound } from '../utils/audio.js';
import { toast } from './Toast.js';
import { 
  X, 
  Copy, 
  Terminal, 
  GitBranch, 
  Lock, 
  MessageSquare, 
  Bot, 
  Zap,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface CrossTalkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrossTalkGuideModal: React.FC<CrossTalkGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    sound.playClick();
    toast.success('Copied to Clipboard', label);
  };

  const guides = [
    {
      title: '1. Direct Cross-Terminal Prompting',
      desc: 'Type a prompt directly into another agent’s terminal stdin and hit enter. The other agent receives it immediately and starts working.',
      cmd: 'agent-bridge prompt --to reviewer "Please test the auth endpoints on port 3000 and report back"',
      icon: <Terminal className="w-4 h-4 text-cyber-indigo" />
    },
    {
      title: '2. Prevent File Conflicts (Resource Locks)',
      desc: 'Lock a file before making edits so other agents know not to modify it concurrently. Prevents file overwrite clashes.',
      cmd: 'agent-bridge lock src/services/auth.ts',
      icon: <Lock className="w-4 h-4 text-cyber-amber" />
    },
    {
      title: '3. Git Worktree Sandboxing',
      desc: 'When spawning an agent with "Isolate in Git Worktree", Matter checks out an independent branch. Agents can edit code simultaneously without Git index conflicts.',
      cmd: 'agent-bridge status',
      icon: <GitBranch className="w-4 h-4 text-cyber-green" />
    },
    {
      title: '4. Inter-Agent Chat & Notifications',
      desc: 'Send messages or broadcast system events across all active terminals without interrupting their current stdin.',
      cmd: 'agent-bridge broadcast "Database migration completed. APIs are now live."',
      icon: <MessageSquare className="w-4 h-4 text-cyber-purple" />
    },
    {
      title: '5. Shared Blackboard (Exchange API Schemas)',
      desc: 'Share data contracts, tokens, or URLs on the central blackboard for other agents to read.',
      cmd: 'agent-bridge blackboard set "api_spec" \'{"port":3000,"auth":"bearer"}\'',
      icon: <Layers className="w-4 h-4 text-cyber-cyan" />
    },
    {
      title: '6. Claim & Complete Tasks',
      desc: 'Coordinate a shared task queue so agents never duplicate work.',
      cmd: 'agent-bridge task claim task-1 && agent-bridge task complete task-1 --result "Finished"',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-obsidian-900 border border-white/[0.12] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyber-indigo/20 border border-cyber-indigo/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyber-indigo" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                How Agents Talk & Avoid Conflicts
              </h3>
              <p className="text-[11px] text-slate-400">
                Commands available inside every terminal session via <code className="text-cyber-indigo font-mono">agent-bridge</code>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {guides.map((g) => (
            <div
              key={g.title}
              className="p-3 bg-obsidian-950 border border-white/[0.07] rounded-xl hover:border-white/[0.14] transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {g.icon}
                  <span className="text-xs font-semibold text-slate-200">{g.title}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(g.cmd, g.title)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-obsidian-900 hover:bg-cyber-indigo/20 text-slate-400 hover:text-cyber-indigo border border-white/[0.08] rounded text-[10px] font-mono transition-colors"
                >
                  <Copy className="w-2.5 h-2.5" />
                  <span>Copy</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                {g.desc}
              </p>

              <div className="p-2 bg-obsidian-900 rounded-lg border border-white/[0.05] font-mono text-[11px] text-cyber-indigo break-all flex items-center justify-between">
                <span>{g.cmd}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-obsidian-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            PATH includes agent-bridge automatically
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
