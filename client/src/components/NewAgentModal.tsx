import React, { useState, useEffect } from 'react';
import { AgentSessionConfig } from '../types.js';
import { sound } from '../utils/audio.js';
import { X, Sparkles, FolderGit2, Terminal, Shield, Plus, Trash2, Check } from 'lucide-react';

interface NewAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpawn: (config: AgentSessionConfig) => void;
}

const PRESET_ROLES = [
  { name: 'Gemini CLI Agent', role: 'Lead Developer', color: '#6366f1', command: '' },
  { name: 'Claude Code Agent', role: 'Architect & Reviewer', color: '#ec4899', command: '' },
  { name: 'ChatGPT CLI Agent', role: 'Fullstack Developer', color: '#10b981', command: '' },
  { name: 'Test & QA Agent', role: 'QA Engineer', color: '#f59e0b', command: 'npm test' },
  { name: 'DevOps / Server Agent', role: 'Ops & Dev Server', color: '#06b6d4', command: '' },
  { name: 'Custom Shell Terminal', role: 'Interactive Terminal', color: '#8b5cf6', command: '' },
];

const COLOR_PALETTE = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

export const NewAgentModal: React.FC<NewAgentModalProps> = ({ isOpen, onClose, onSpawn }) => {
  const [name, setName] = useState('Gemini Developer');
  const [role, setRole] = useState('Lead Developer');
  const [color, setColor] = useState('#6366f1');
  const [shell, setShell] = useState('powershell.exe');
  const [cwd, setCwd] = useState('');
  const [command, setCommand] = useState('');
  const [isolateWorktree, setIsolateWorktree] = useState(false);
  const [worktreeBranch, setWorktreeBranch] = useState('');
  const [envVars, setEnvVars] = useState<Array<{ key: string; val: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      sound.playClick();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESET_ROLES[0]) => {
    sound.playClick();
    setName(preset.name);
    setRole(preset.role);
    setColor(preset.color);
    setCommand(preset.command);
  };

  const handleAddEnv = () => {
    sound.playClick();
    setEnvVars([...envVars, { key: '', val: '' }]);
  };

  const handleRemoveEnv = (idx: number) => {
    sound.playWarn();
    setEnvVars(envVars.filter((_, i) => i !== idx));
  };

  const handleUpdateEnv = (idx: number, field: 'key' | 'val', value: string) => {
    const next = [...envVars];
    next[idx][field] = value;
    setEnvVars(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    const envObj: Record<string, string> = {};
    envVars.forEach(({ key, val }) => {
      if (key.trim()) envObj[key.trim()] = val.trim();
    });

    const safeId = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).slice(-4)}`;

    onSpawn({
      id: safeId,
      name: name.trim() || 'Agent',
      role: role.trim() || 'General',
      color,
      shell: shell.trim() || 'powershell.exe',
      cwd: cwd.trim() || undefined,
      command: command.trim() || undefined,
      isolateWorktree,
      worktreeBranch: worktreeBranch.trim() || undefined,
      env: envObj,
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="bg-obsidian-900 border border-white/[0.12] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-100 shadow-black/90 select-none font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-obsidian-850 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyber-indigo/15 border border-cyber-indigo/30 flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-cyber-indigo" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm tracking-tight">Spawn Terminal Agent</h3>
              <p className="text-[11px] text-slate-400">Launch an isolated pseudo-terminal with agent-bridge companion.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-2">Agent Role Templates</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_ROLES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    name === preset.name
                      ? 'bg-cyber-indigo/15 border-cyber-indigo text-slate-100 shadow-sm'
                      : 'bg-obsidian-950 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                    <span className="font-semibold text-[11px] truncate">{preset.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{preset.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Agent Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gemini CLI"
                className="w-full bg-obsidian-950 border border-white/[0.08] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyber-indigo"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Role Description</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="w-full bg-obsidian-950 border border-white/[0.08] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyber-indigo"
                required
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Accent Color</label>
            <div className="flex items-center gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setColor(c);
                  }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Shell & Working Directory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 font-sans">Shell Executable</label>
              <select
                value={shell}
                onChange={(e) => setShell(e.target.value)}
                className="w-full bg-obsidian-950 border border-white/[0.08] rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value="powershell.exe">PowerShell (Default)</option>
                <option value="cmd.exe">Command Prompt (CMD)</option>
                <option value="bash">Bash</option>
                <option value="wsl.exe">WSL (Linux Subsystem)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 font-sans">Working Directory (Optional)</label>
              <input
                type="text"
                value={cwd}
                onChange={(e) => setCwd(e.target.value)}
                placeholder="Workspace Root"
                className="w-full bg-obsidian-950 border border-white/[0.08] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyber-indigo"
              />
            </div>
          </div>

          {/* Workspace Isolation Toggle */}
          <div className="p-3 bg-obsidian-950 border border-white/[0.08] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-cyber-amber" />
                <div>
                  <span className="font-semibold text-slate-200">Git Worktree Isolation</span>
                  <p className="text-[10px] text-slate-400">Run agent on an independent git branch sandbox.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isolateWorktree}
                onChange={(e) => {
                  sound.playClick();
                  setIsolateWorktree(e.target.checked);
                }}
                className="w-4 h-4 accent-cyber-indigo rounded"
              />
            </div>

            {isolateWorktree && (
              <div className="pt-2 border-t border-white/[0.06]">
                <label className="block text-[10px] text-slate-400 mb-1 font-mono">Branch Name (Optional)</label>
                <input
                  type="text"
                  value={worktreeBranch}
                  onChange={(e) => setWorktreeBranch(e.target.value)}
                  placeholder="e.g. feature/agent-auth"
                  className="w-full bg-obsidian-900 border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Startup Command */}
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Startup Command (Optional)</label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g. gemini, claude, python agent.py"
              className="w-full bg-obsidian-950 border border-white/[0.08] rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyber-indigo"
            />
          </div>

          {/* Custom Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-slate-300">Environment Variables</label>
              <button
                type="button"
                onClick={handleAddEnv}
                className="flex items-center gap-1 text-[10px] text-cyber-indigo hover:text-cyber-indigo/80 font-mono"
              >
                <Plus className="w-3 h-3" />
                <span>Add Var</span>
              </button>
            </div>
            {envVars.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic">No custom env vars configured.</p>
            ) : (
              <div className="space-y-1.5">
                {envVars.map((env, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="KEY (e.g. PORT)"
                      value={env.key}
                      onChange={(e) => handleUpdateEnv(idx, 'key', e.target.value)}
                      className="w-1/3 bg-obsidian-950 border border-white/[0.08] rounded px-2 py-1 text-slate-200 font-mono text-xs"
                    />
                    <input
                      type="text"
                      placeholder="VALUE (e.g. 3005)"
                      value={env.val}
                      onChange={(e) => handleUpdateEnv(idx, 'val', e.target.value)}
                      className="flex-1 bg-obsidian-950 border border-white/[0.08] rounded px-2 py-1 text-slate-200 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveEnv(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-obsidian-850 hover:bg-obsidian-800 text-slate-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white font-semibold rounded-lg shadow-glow-indigo transition-colors"
            >
              Launch Terminal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
