// Temporary interfaces for missing Prisma models

export interface UserCours {
  id: number;
  userId: number;
  coursId: number;
  createdAt: Date;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  cours?: any;
}

export interface Presence {
  id: number;
  userId: number;
  coursId: number;
  present: boolean;
  createdAt: Date;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  status: string;
  stock?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageEntity {
  id: number;
  content: string;
  senderId: number;
  recipientId: number;
  subject?: string;
  body?: string;
  tenantId: string;
  status: string;
  type: string;
  priority: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}