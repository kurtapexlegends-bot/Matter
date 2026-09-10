export type AgentStatus = 'idle' | 'running' | 'busy' | 'error' | 'stopped';

export interface AgentSessionConfig {
  id: string;
  name: string;
  role: string;
  color?: string;
  cwd?: string;
  shell?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  isolateWorktree?: boolean;
  worktreeBranch?: string;
  repoRoot?: string;
  autoApprove?: boolean;
}

export interface AgentSessionInfo {
  id: string;
  name: string;
  role: string;
  color: string;
  status: AgentStatus;
  cwd: string;
  shell: string;
  command?: string;
  pid?: number;
  createdAt: number;
  isolateWorktree: boolean;
  worktreeBranch?: string;
  worktreePath?: string;
  autoApprove?: boolean;
  env: Record<string, string>;
}

export type MessageType = 'chat' | 'task' | 'contract' | 'event' | 'broadcast' | 'system';

export interface AgentMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  type: MessageType;
  content: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface BlackboardEntry {
  key: string;
  value: any;
  updatedBy: string;
  updatedAt: number;
  tags?: string[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface HarnessTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  result?: string;
}

export interface SwarmPreset {
  id: string;
  name: string;
  description: string;
  agents: Array<{
    name: string;
    role: string;
    color: string;
    command?: string;
    isolateWorktree?: boolean;
    worktreeBranch?: string;
  }>;
  initialTasks?: Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    assignedToRole?: string;
  }>;
}

export type LayoutMode = 'grid' | 'tabs' | 'horizontal' | 'vertical';
export type ActiveSideTab = 'messages' | 'blackboard' | 'tasks' | 'scratchpad' | 'none';
