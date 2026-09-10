import React, { useState } from 'react';
import { BlackboardEntry, HarnessTask, AgentSessionInfo, TaskPriority, TaskStatus } from '../types.js';
import { sound } from '../utils/audio.js';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  FileText, 
  Database, 
  ListTodo, 
  User, 
  Save,
  Copy,
  Check,
  Tag
} from 'lucide-react';

interface BlackboardViewProps {
  blackboard: BlackboardEntry[];
  tasks: HarnessTask[];
  scratchpad: string;
  agents: AgentSessionInfo[];
  onSetBlackboard: (key: string, value: any) => void;
  onDeleteBlackboard: (key: string) => void;
  onSaveScratchpad: (content: string) => void;
  onCreateTask: (title: string, description: string, priority: TaskPriority, assignedTo?: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onClaimTask: (taskId: string, agentId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const BlackboardView: React.FC<BlackboardViewProps> = ({
  blackboard,
  tasks,
  scratchpad,
  agents,
  onSetBlackboard,
  onDeleteBlackboard,
  onSaveScratchpad,
  onCreateTask,
  onUpdateTaskStatus,
  onClaimTask,
  onDeleteTask,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'kv' | 'scratchpad'>('tasks');

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskAssignee, setTaskAssignee] = useState('');

  // KV form state
  const [showKvForm, setShowKvForm] = useState(false);
  const [kvKey, setKvKey] = useState('');
  const [kvVal, setKvVal] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Scratchpad state
  const [scratchContent, setScratchContent] = useState(scratchpad);
  const [isSaved, setIsSaved] = useState(true);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    sound.playSuccess();
    onCreateTask(taskTitle.trim(), taskDesc.trim(), taskPriority, taskAssignee || undefined);
    setTaskTitle('');
    setTaskDesc('');
    setShowTaskForm(false);
  };

  const handleSetKv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kvKey.trim()) return;
    sound.playSuccess();
    let parsed: any = kvVal;
    try {
      parsed = JSON.parse(kvVal);
    } catch (e) {}
    onSetBlackboard(kvKey.trim(), parsed);
    setKvKey('');
    setKvVal('');
    setShowKvForm(false);
  };

  const handleCopyValue = (key: string, val: any) => {
    sound.playClick();
    const str = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
    navigator.clipboard.writeText(str);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleScratchChange = (val: string) => {
    setScratchContent(val);
    setIsSaved(false);
  };

  const handleSaveScratchpad = () => {
    sound.playSuccess();
    onSaveScratchpad(scratchContent);
    setIsSaved(true);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return <span className="px-1.5 py-0.5 text-[10px] bg-cyber-rose/15 text-cyber-rose border border-cyber-rose/30 rounded font-mono font-semibold">URGENT</span>;
      case 'high':
        return <span className="px-1.5 py-0.5 text-[10px] bg-cyber-amber/15 text-cyber-amber border border-cyber-amber/30 rounded font-mono font-semibold">HIGH</span>;
      case 'low':
        return <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 border border-white/[0.08] rounded font-mono">LOW</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] bg-cyber-indigo/15 text-cyber-indigo border border-cyber-indigo/30 rounded font-mono">MEDIUM</span>;
    }
  };

  const getAgentName = (agentId?: string) => {
    if (!agentId) return 'Unassigned';
    const a = agents.find((ag) => ag.id === agentId);
    return a ? a.name : agentId;
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-900 border-l border-white/[0.08] w-full overflow-hidden select-none font-sans">
      {/* Sub Tabs Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-obsidian-850 border-b border-white/[0.08]">
        <div className="flex items-center gap-1 bg-obsidian-950 p-0.5 rounded-lg border border-white/[0.08]">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('tasks');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'tasks' ? 'bg-cyber-indigo/20 text-cyber-indigo font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Tasks ({tasks.length})</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('kv');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'kv' ? 'bg-cyber-indigo/20 text-cyber-indigo font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Variables ({blackboard.length})</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('scratchpad');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'scratchpad' ? 'bg-cyber-indigo/20 text-cyber-indigo font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
          </button>
        </div>

        {activeTab === 'tasks' && (
          <button
            onClick={() => {
              sound.playClick();
              setShowTaskForm(!showTaskForm);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        )}

        {activeTab === 'kv' && (
          <button
            onClick={() => {
              sound.playClick();
              setShowKvForm(!showKvForm);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Variable</span>
          </button>
        )}

        {activeTab === 'scratchpad' && (
          <button
            onClick={handleSaveScratchpad}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              isSaved ? 'bg-obsidian-950 text-slate-400 border border-white/[0.08]' : 'bg-cyber-green hover:bg-cyber-green/90 text-white shadow-sm'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Saved' : 'Save Notes'}</span>
          </button>
        )}
      </div>

      {/* Main Tab Viewport */}
      <div className="flex-1 p-3 overflow-y-auto bg-obsidian-950/60">
        {/* --- TASKS TAB --- */}
        {activeTab === 'tasks' && (
          <div className="space-y-2.5">
            {/* New Task Form */}
            {showTaskForm && (
              <form onSubmit={handleCreateTask} className="p-3 bg-obsidian-850 border border-white/[0.1] rounded-xl space-y-2 mb-3 shadow-lg animate-in fade-in duration-100">
                <h4 className="text-xs font-bold text-slate-100">Create Swarm Task</h4>
                <input
                  type="text"
                  placeholder="Task title (e.g. Implement user login API)"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-obsidian-950 border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyber-indigo"
                  required
                />
                <textarea
                  placeholder="Task description & deliverables..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-obsidian-950 border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyber-indigo"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="bg-obsidian-950 border border-white/[0.08] rounded px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>

                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="flex-1 bg-obsidian-950 border border-white/[0.08] rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">Assign to: Anyone</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>

                  <button type="submit" className="px-3 py-1 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white rounded text-xs font-semibold">
                    Add
                  </button>
                  <button type="button" onClick={() => setShowTaskForm(false)} className="px-2.5 py-1 bg-obsidian-950 text-slate-400 border border-white/[0.08] rounded text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs">
                <ListTodo className="w-8 h-8 mb-2 opacity-20" />
                <p className="font-medium text-slate-400">No active tasks in queue</p>
                <p className="text-[10px] text-slate-600 mt-1 font-mono">
                  Agents claim tasks via <span className="text-cyber-indigo">agent-bridge task claim</span>
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    task.status === 'done'
                      ? 'bg-cyber-green/[0.04] border-cyber-green/20'
                      : task.status === 'in_progress'
                      ? 'bg-cyber-indigo/[0.06] border-cyber-indigo/30 shadow-sm'
                      : 'bg-obsidian-850/90 border-white/[0.07] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => {
                          sound.playSuccess();
                          onUpdateTaskStatus(
                            task.id,
                            task.status === 'done' ? 'in_progress' : 'done'
                          );
                        }}
                        title="Toggle status"
                        className="text-slate-400 hover:text-cyber-green transition-colors shrink-0"
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <span className={`font-semibold text-slate-100 truncate ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {getPriorityBadge(task.priority)}
                      <button
                        onClick={() => {
                          sound.playWarn();
                          onDeleteTask(task.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-slate-400 text-[11px] mb-2 leading-relaxed pl-6 font-sans">
                      {task.description}
                    </p>
                  )}

                  {/* Task Meta & Assignee Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] pl-6 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-400 font-sans">
                      <User className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-300 font-medium">{getAgentName(task.assignedTo)}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      {task.status !== 'done' && (
                        <select
                          value={task.assignedTo || ''}
                          onChange={(e) => {
                            sound.playClick();
                            onClaimTask(task.id, e.target.value);
                          }}
                          className="bg-obsidian-950 border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                        >
                          <option value="">Reassign</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <span className="text-[10px] text-slate-500">ID: {task.id}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- KV VARIABLES TAB --- */}
        {activeTab === 'kv' && (
          <div className="space-y-2.5">
            {showKvForm && (
              <form onSubmit={handleSetKv} className="p-3 bg-obsidian-850 border border-white/[0.1] rounded-xl space-y-2 mb-3 shadow-lg animate-in fade-in duration-100">
                <h4 className="text-xs font-bold text-slate-100">Set Blackboard Variable</h4>
                <input
                  type="text"
                  placeholder="Key name (e.g. api_contract, db_schema)"
                  value={kvKey}
                  onChange={(e) => setKvKey(e.target.value)}
                  className="w-full bg-obsidian-950 border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyber-indigo"
                  required
                />
                <textarea
                  placeholder='Value (String or JSON: {"port": 3000})'
                  value={kvVal}
                  onChange={(e) => setKvVal(e.target.value)}
                  rows={3}
                  className="w-full bg-obsidian-950 border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyber-indigo"
                  required
                />
                <div className="flex items-center gap-2">
                  <button type="submit" className="px-3 py-1 bg-cyber-indigo hover:bg-cyber-indigo/90 text-white rounded text-xs font-semibold">
                    Save Variable
                  </button>
                  <button type="button" onClick={() => setShowKvForm(false)} className="px-2.5 py-1 bg-obsidian-950 text-slate-400 border border-white/[0.08] rounded text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {blackboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs">
                <Database className="w-8 h-8 mb-2 opacity-20" />
                <p className="font-medium text-slate-400">No variables stored</p>
                <p className="text-[10px] text-slate-600 mt-1 font-mono">
                  Agents store state via <span className="text-cyber-indigo">agent-bridge blackboard set</span>
                </p>
              </div>
            ) : (
              blackboard.map((entry) => (
                <div key={entry.key} className="p-3 bg-obsidian-850/90 border border-white/[0.08] rounded-xl text-xs space-y-1.5 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyber-indigo text-xs">{entry.key}</span>
                      <span className="text-[10px] text-slate-500 font-mono">by {entry.updatedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyValue(entry.key, entry.value)}
                        title="Copy value"
                        className="text-slate-500 hover:text-slate-200 p-1"
                      >
                        {copiedKey === entry.key ? <Check className="w-3 h-3 text-cyber-green" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => {
                          sound.playWarn();
                          onDeleteBlackboard(entry.key);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-2 bg-obsidian-950 border border-white/[0.05] rounded-md font-mono text-[11px] text-cyber-green overflow-x-auto max-h-40">
                    {typeof entry.value === 'object' ? JSON.stringify(entry.value, null, 2) : String(entry.value)}
                  </pre>
                  <div className="text-[10px] text-slate-500 font-mono text-right">
                    Updated: {new Date(entry.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- SCRATCHPAD TAB --- */}
        {activeTab === 'scratchpad' && (
          <div className="flex flex-col h-full space-y-2 font-mono">
            <textarea
              value={scratchContent}
              onChange={(e) => handleScratchChange(e.target.value)}
              placeholder="Shared notes, contract drafts, and global requirements..."
              className="w-full flex-1 min-h-[350px] bg-obsidian-950 border border-white/[0.08] rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-cyber-indigo resize-none font-mono"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>{scratchContent.length} chars · {scratchContent.split(/\s+/).filter(Boolean).length} words</span>
              <span>All agents can read/write simultaneously</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
