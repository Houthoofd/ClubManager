/**
 * Message Validators
 * Validation logic for messages, notifications, and communication
 */

import {
  MessageType,
  MessagePriority,
  MessageStatus,
  CreateMessageDTO,
  BulkMessageDTO,
  UpdateMessageDTO,
} from "@clubmanager/types";

export class MessageValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "MessageValidationError";
  }
}

/**
 * Validate message creation data
 */
export function validateCreateMessage(data: CreateMessageDTO): void {
  if (!data.recipientId || data.recipientId <= 0) {
    throw new MessageValidationError(
      "Valid recipient ID is required",
      "recipientId",
    );
  }

  if (data.senderId !== undefined && data.senderId <= 0) {
    throw new MessageValidationError("Valid sender ID is required", "senderId");
  }

  if (!data.subject || data.subject.trim().length === 0) {
    throw new MessageValidationError("Message subject is required", "subject");
  }

  if (data.subject.length > 500) {
    throw new MessageValidationError(
      "Message subject must be less than 500 characters",
      "subject",
    );
  }

  if (!data.body || data.body.trim().length === 0) {
    throw new MessageValidationError("Message body is required", "body");
  }

  if (data.body.length > 10000) {
    throw new MessageValidationError(
      "Message body must be less than 10000 characters",
      "body",
    );
  }

  if (!data.type || !Object.values(MessageType).includes(data.type)) {
    throw new MessageValidationError("Valid message type is required", "type");
  }

  if (
    data.priority &&
    !Object.values(MessagePriority).includes(data.priority)
  ) {
    throw new MessageValidationError("Invalid message priority", "priority");
  }

  if (data.scheduledAt && data.scheduledAt < new Date()) {
    throw new MessageValidationError(
      "Scheduled time must be in the future",
      "scheduledAt",
    );
  }

  if (!data.tenantId || data.tenantId <= 0) {
    throw new MessageValidationError("Valid tenant ID is required", "tenantId");
  }

  // Validate email-specific requirements
  if (data.type === MessageType.EMAIL) {
    validateEmailFormat(data);
  }

  // Validate SMS-specific requirements
  if (data.type === MessageType.SMS) {
    validateSMSFormat(data);
  }
}

/**
 * Validate bulk message data
 */
export function validateBulkMessage(data: BulkMessageDTO): void {
  if (
    !data.recipientIds ||
    !Array.isArray(data.recipientIds) ||
    data.recipientIds.length === 0
  ) {
    throw new MessageValidationError(
      "At least one recipient is required",
      "recipientIds",
    );
  }

  if (data.recipientIds.length > 1000) {
    throw new MessageValidationError(
      "Cannot send to more than 1000 recipients at once",
      "recipientIds",
    );
  }

  // Validate each recipient ID
  data.recipientIds.forEach((id, index) => {
    if (!id || id <= 0) {
      throw new MessageValidationError(
        `Invalid recipient ID at position ${index + 1}`,
        `recipientIds[${index}]`,
      );
    }
  });

  // Check for duplicates
  const uniqueRecipients = new Set(data.recipientIds);
  if (uniqueRecipients.size !== data.recipientIds.length) {
    throw new MessageValidationError(
      "Duplicate recipient IDs found",
      "recipientIds",
    );
  }

  if (!data.subject || data.subject.trim().length === 0) {
    throw new MessageValidationError("Message subject is required", "subject");
  }

  if (data.subject.length > 500) {
    throw new MessageValidationError(
      "Message subject must be less than 500 characters",
      "subject",
    );
  }

  if (!data.body || data.body.trim().length === 0) {
    throw new MessageValidationError("Message body is required", "body");
  }

  if (data.body.length > 10000) {
    throw new MessageValidationError(
      "Message body must be less than 10000 characters",
      "body",
    );
  }

  if (!data.type || !Object.values(MessageType).includes(data.type)) {
    throw new MessageValidationError("Valid message type is required", "type");
  }

  if (
    data.priority &&
    !Object.values(MessagePriority).includes(data.priority)
  ) {
    throw new MessageValidationError("Invalid message priority", "priority");
  }

  if (!data.tenantId || data.tenantId <= 0) {
    throw new MessageValidationError("Valid tenant ID is required", "tenantId");
  }
}

/**
 * Validate message update data
 */
export function validateUpdateMessage(data: UpdateMessageDTO): void {
  if (data.status && !Object.values(MessageStatus).includes(data.status)) {
    throw new MessageValidationError("Invalid message status", "status");
  }

  if (data.readAt && !(data.readAt instanceof Date)) {
    throw new MessageValidationError(
      "Read time must be a valid date",
      "readAt",
    );
  }

  if (data.deliveredAt && !(data.deliveredAt instanceof Date)) {
    throw new MessageValidationError(
      "Delivered time must be a valid date",
      "deliveredAt",
    );
  }

  // Validate that readAt is after deliveredAt if both are provided
  if (data.readAt && data.deliveredAt && data.readAt < data.deliveredAt) {
    throw new MessageValidationError(
      "Read time cannot be before delivery time",
      "readAt",
    );
  }
}

/**
 * Validate email-specific format
 */
function validateEmailFormat(data: CreateMessageDTO): void {
  // Email subject should not be too short
  if (data.subject.trim().length < 3) {
    throw new MessageValidationError(
      "Email subject must be at least 3 characters",
      "subject",
    );
  }

  // Email body should have minimum length
  if (data.body.trim().length < 10) {
    throw new MessageValidationError(
      "Email body must be at least 10 characters",
      "body",
    );
  }
}

/**
 * Validate SMS-specific format
 */
function validateSMSFormat(data: CreateMessageDTO): void {
  // SMS has character limit (160 chars for single SMS)
  if (data.body.length > 1600) {
    throw new MessageValidationError(
      "SMS body must be less than 1600 characters",
      "body",
    );
  }

  // SMS subject is usually short or not used
  if (data.subject.length > 50) {
    throw new MessageValidationError(
      "SMS subject must be less than 50 characters",
      "subject",
    );
  }
}

/**
 * Validate message status transition
 */
export function validateMessageStatusTransition(
  currentStatus: MessageStatus,
  newStatus: MessageStatus,
): void {
  const validTransitions: Record<MessageStatus, MessageStatus[]> = {
    [MessageStatus.DRAFT]: [MessageStatus.SENT, MessageStatus.ARCHIVED],
    [MessageStatus.SENT]: [
      MessageStatus.DELIVERED,
      MessageStatus.FAILED,
      MessageStatus.ARCHIVED,
    ],
    [MessageStatus.DELIVERED]: [MessageStatus.READ, MessageStatus.ARCHIVED],
    [MessageStatus.READ]: [MessageStatus.ARCHIVED],
    [MessageStatus.FAILED]: [MessageStatus.SENT, MessageStatus.ARCHIVED],
    [MessageStatus.ARCHIVED]: [],
  };

  const allowed = validTransitions[currentStatus];
  if (!allowed.includes(newStatus)) {
    throw new MessageValidationError(
      `Cannot transition from ${currentStatus} to ${newStatus}`,
      "status",
    );
  }
}

/**
 * Validate message ID
 */
export function validateMessageId(id: number): void {
  if (!id || id <= 0 || !Number.isInteger(id)) {
    throw new MessageValidationError(
      "Valid message ID is required",
      "messageId",
    );
  }
}

/**
 * Validate user ID
 */
export function validateUserId(id: number): void {
  if (!id || id <= 0 || !Number.isInteger(id)) {
    throw new MessageValidationError("Valid user ID is required", "userId");
  }
}

/**
 * Validate message type
 */
export function validateMessageType(type: string): asserts type is MessageType {
  if (!Object.values(MessageType).includes(type as MessageType)) {
    throw new MessageValidationError("Invalid message type", "type");
  }
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(
  template: string,
  variables: Record<string, any>,
): void {
  // Find all {{variable}} patterns in template
  const variablePattern = /\{\{(\w+)\}\}/g;
  const requiredVars: string[] = [];
  let match;

  while ((match = variablePattern.exec(template)) !== null) {
    requiredVars.push(match[1]);
  }

  // Check if all required variables are provided
  const missingVars = requiredVars.filter((v) => !(v in variables));
  if (missingVars.length > 0) {
    throw new MessageValidationError(
      `Missing required variables: ${missingVars.join(", ")}`,
      "variables",
    );
  }
}
