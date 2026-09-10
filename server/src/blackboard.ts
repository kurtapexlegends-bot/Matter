import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BlackboardEntry, HarnessTask, TaskPriority, TaskStatus } from './types.js';

export class Blackboard extends EventEmitter {
  private kvStore: Map<string, BlackboardEntry> = new Map();
  private tasks: Map<string, HarnessTask> = new Map();
  private scratchpad: string = '# Shared Agent Scratchpad\nShare architecture notes, API contracts, and active decisions here.\n';

  constructor() {
    super();
  }

  // Key-Value operations
  public set(key: string, value: any, updatedBy: string, tags?: string[]): BlackboardEntry {
    const entry: BlackboardEntry = {
      key,
      value,
      updatedBy,
      updatedAt: Date.now(),
      tags,
    };
    this.kvStore.set(key, entry);
    this.emit('kv:updated', entry);
    return entry;
  }

  public get(key: string): any {
    return this.kvStore.get(key)?.value;
  }

  public getEntry(key: string): BlackboardEntry | undefined {
    return this.kvStore.get(key);
  }

  public getAll(): BlackboardEntry[] {
    return Array.from(this.kvStore.values());
  }

  public delete(key: string): boolean {
    const result = this.kvStore.delete(key);
    if (result) {
      this.emit('kv:deleted', key);
    }
    return result;
  }

  // Scratchpad operations
  public getScratchpad(): string {
    return this.scratchpad;
  }

  public setScratchpad(content: string, updatedBy: string): string {
    this.scratchpad = content;
    this.emit('scratchpad:updated', { content, updatedBy, updatedAt: Date.now() });
    return this.scratchpad;
  }

  // Task Operations
  public createTask(
    title: string,
    description: string,
    createdBy: string,
    priority: TaskPriority = 'medium',
    assignedTo?: string
  ): HarnessTask {
    const task: HarnessTask = {
      id: `task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      description,
      status: assignedTo ? 'in_progress' : 'todo',
      priority,
      assignedTo,
      createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(task.id, task);
    this.emit('task:created', task);
    return task;
  }

  public updateTask(
    taskId: string,
    updates: Partial<Omit<HarnessTask, 'id' | 'createdAt'>>
  ): HarnessTask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    Object.assign(task, updates, { updatedAt: Date.now() });
    this.tasks.set(taskId, task);
    this.emit('task:updated', task);
    return task;
  }

  public claimTask(taskId: string, agentId: string): HarnessTask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    task.assignedTo = agentId;
    task.status = 'in_progress';
    task.updatedAt = Date.now();
    this.emit('task:updated', task);
    return task;
  }

  public completeTask(taskId: string, result?: string): HarnessTask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    task.status = 'done';
    task.result = result;
    task.updatedAt = Date.now();
    this.emit('task:updated', task);
    return task;
  }

  public getTasks(status?: TaskStatus, assignedTo?: string): HarnessTask[] {
    let list = Array.from(this.tasks.values());
    if (status) {
      list = list.filter((t) => t.status === status);
    }
    if (assignedTo) {
      list = list.filter((t) => t.assignedTo === assignedTo);
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  public getTask(taskId: string): HarnessTask | undefined {
    return this.tasks.get(taskId);
  }

  public deleteTask(taskId: string): boolean {
    const res = this.tasks.delete(taskId);
    if (res) {
      this.emit('task:deleted', taskId);
    }
    return res;
  }
}

export const globalBlackboard = new Blackboard();
