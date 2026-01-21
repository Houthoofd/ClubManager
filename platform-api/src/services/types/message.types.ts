// Message types

export interface Message {
  id: number;
  tenantId: string;
  senderId: number;
  recipientId: number | null;
  subject: string;
  body: string;
  status: string;
  priority: string;
  type: string;
  scheduledFor: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageFilter {
  senderId?: number;
  recipientId?: number;
  status?: string;
  type?: string;
  priority?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export enum MessageStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum MessageType {
  PRIVATE = 'prive',
  GROUP = 'groupe',
  BROADCAST = 'diffusion'
}

export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}