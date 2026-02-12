/**
 * Barrel export pour EmailClient
 * Fournit une compatibilité descendante avec l'ancien chemin d'import
 *
 * @deprecated Utilisez plutôt l'import depuis 'infrastructure/external-services/email'
 */

export { EmailClient, emailClient } from "./email/email-client.js";
export type { EmailSendRequest, EmailSendResult } from "@clubmanager/types";
