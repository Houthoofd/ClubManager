/**
 * Messages Domain
 */

// Base types (messages.ts - avoid Message export due to conflict)
export type {
  TypeMessage,
  EmailDetail,
  EnvoiMessageDetails,
  EnvoiMessageData,
  MessageStatistiques,
  MessageNonLusCount,
  MessageOperationResult,
  RappelPaiementData,
  RappelPaiementResult,
  SendCustomEmailOptions,
  SendTemplateEmailOptions,
  SendWelcomeEmailOptions,
  SendValidationEmailOptions,
  MessageHistory,
  EmailStatistics,
  MessagesResponse,
  TypeMessageResponse,
  EmailOperationResult,
} from "./types.js";

// Messagerie types
export * from "./messagerie.types.js";

// Validators
export * from "./validators.js";

// GraphQL
export * from "./graphql.types.js";
export { messagesTypeDefs } from "./graphql.types.js";
