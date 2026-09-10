import React, { useEffect } from 'react';
import { SwarmPreset } from '../types.js';
import { sound } from '../utils/audio.js';
import { X, Sparkles, Rocket, Users, CheckCircle2, GitBranch } from 'lucide-react';

interface PresetSwarmModalProps {
  isOpen: boolean;
  presets: SwarmPreset[];
  onClose: () => void;
  onLaunchPreset: (presetId: string) => void;
}

export const PresetSwarmModal: React.FC<PresetSwarmModalProps> = ({
  isOpen,
  presets,
  onClose,
  onLaunchPreset,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playClick();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="bg-obsidian-900 border border-white/[0.12] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-black/90 animate-in zoom-in-95 duration-100 select-none font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-obsidian-850 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyber-amber/15 border border-cyber-amber/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-cyber-amber" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm tracking-tight">Preset Agent Swarms</h3>
              <p className="text-[11px] text-slate-400">Launch multi-agent teams with inter-agent communication and pre-loaded task queues.</p>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-4 bg-obsidian-950 border border-white/[0.08] hover:border-white/[0.16] rounded-2xl transition-all shadow-sm flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-sm font-bold text-slate-100 font-sans tracking-tight">{preset.name}</h4>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-cyber-indigo bg-cyber-indigo/10 border border-cyber-indigo/30 px-2 py-0.5 rounded-full">
                    <Users className="w-3 h-3" />
                    <span>{preset.agents.length} AGENTS</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed font-sans">{preset.description}</p>

                {/* Agents in Swarm */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-mono font-semibold text-slate-500">
                    Swarm Roster:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {preset.agents.map((ag, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 bg-obsidian-900 border border-white/[0.06] rounded-xl text-xs"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ag.color }} />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-200 truncate font-sans text-[11px]">{ag.name}</div>
                          <div className="text-[10px] text-slate-500 truncate font-mono">{ag.role}</div>
                        </div>
                        {ag.isolateWorktree && (
                          <span title="Git Worktree Isolated" className="ml-auto shrink-0">
                            <GitBranch className="w-3 h-3 text-cyber-amber" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Initial Tasks */}
                {preset.initialTasks && preset.initialTasks.length > 0 && (
                  <div className="p-2.5 bg-obsidian-900/60 border border-white/[0.05] rounded-xl text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-1 font-sans text-xs">Initial Coordinated Tasks:</span>
                    <ul className="space-y-1">
                      {preset.initialTasks.map((t, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 truncate font-sans">
                          <CheckCircle2 className="w-3 h-3 text-cyber-green shrink-0" />
                          <span className="truncate text-slate-300">{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Launch Button */}
              <div className="flex items-center justify-end pt-2 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    sound.playSuccess();
                    onLaunchPreset(preset.id);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyber-amber via-cyber-indigo to-cyber-purple hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-glow-indigo transition-all hover:scale-[1.02]"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Launch Swarm</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
