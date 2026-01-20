/**
 * Message Types & Interfaces
 * Types for messaging, notifications, and communication system
 */

export enum MessageStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED'
}

export enum MessageType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  SYSTEM = 'SYSTEM'
}

export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface MessageFilters {
  userId?: number;
  status?: MessageStatus;
  type?: MessageType;
  priority?: MessagePriority;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  unreadOnly?: boolean;
  tenantId?: number;
}

export interface CreateMessageDTO {
  recipientId: number;
  senderId?: number;
  subject: string;
  body: string;
  type: MessageType;
  priority?: MessagePriority;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
  tenantId: number;
}

export interface BulkMessageDTO {
  recipientIds: number[];
  subject: string;
  body: string;
  type: MessageType;
  priority?: MessagePriority;
  metadata?: Record<string, any>;
  tenantId: number;
}

export interface UpdateMessageDTO {
  status?: MessageStatus;
  readAt?: Date;
  deliveredAt?: Date;
  metadata?: Record<string, any>;
}

export interface MessageTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  type: MessageType;
  variables: string[];
}

export interface NotificationPreferences {
  userId: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  notificationTypes: NotificationType[];
}

export interface MessageStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  deliveryRate: number;
  readRate: number;
  messagesByType: Record<MessageType, number>;
  messagesByStatus: Record<MessageStatus, number>;
}

export interface ConversationThread {
  id: number;
  participants: number[];
  lastMessageAt: Date;
  unreadCount: number;
  messages: MessageSummary[];
}

export interface MessageSummary {
  id: number;
  senderId: number;
  senderName: string;
  subject: string;
  preview: string;
  status: MessageStatus;
  type: MessageType;
  priority: MessagePriority;
  createdAt: Date;
  readAt?: Date;
}
