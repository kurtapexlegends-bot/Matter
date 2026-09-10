import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentMessage, MessageType } from './types.js';

export class MessageBus extends EventEmitter {
  private messages: AgentMessage[] = [];
  private maxHistory: number = 1000;

  constructor(maxHistory = 1000) {
    super();
    this.maxHistory = maxHistory;
  }

  public publish(
    senderId: string,
    senderName: string,
    recipientId: string,
    content: string,
    type: MessageType = 'chat',
    metadata?: Record<string, any>
  ): AgentMessage {
    const msg: AgentMessage = {
      id: uuidv4(),
      senderId,
      senderName,
      recipientId: recipientId || 'all',
      type,
      content,
      metadata,
      timestamp: Date.now(),
    };

    this.messages.push(msg);
    if (this.messages.length > this.maxHistory) {
      this.messages.shift();
    }

    this.emit('message', msg);
    return msg;
  }

  public getMessages(agentId?: string, sinceTimestamp?: number, limit = 50): AgentMessage[] {
    let filtered = this.messages;

    if (sinceTimestamp) {
      filtered = filtered.filter((m) => m.timestamp > sinceTimestamp);
    }

    if (agentId && agentId !== 'all') {
      filtered = filtered.filter(
        (m) => m.recipientId === 'all' || m.recipientId === agentId || m.senderId === agentId
      );
    }

    return filtered.slice(-limit);
  }

  public getConversation(agentA: string, agentB: string, limit = 50): AgentMessage[] {
    const filtered = this.messages.filter(
      (m) =>
        (m.senderId === agentA && m.recipientId === agentB) ||
        (m.senderId === agentB && m.recipientId === agentA) ||
        m.recipientId === 'all'
    );
    return filtered.slice(-limit);
  }

  public clear(): void {
    this.messages = [];
    this.emit('clear');
  }
}

export const globalMessageBus = new MessageBus();
