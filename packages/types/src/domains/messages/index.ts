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

// Validators
export * from "./validators.js";

// Messagerie subdomain (namespace export)
export * as Messagerie from "./messagerie/index.js";

// GraphQL types
// export * from "./graphql.types.js"; // Importable directement si nécessaire

// GraphQL typedefs
export { messagesTypeDefs } from "./graphql.typedefs.js";
