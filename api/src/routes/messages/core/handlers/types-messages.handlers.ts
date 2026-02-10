import { Request, Response } from "express";
import {
  typesMessagesService,
  TypesMessagesService,
} from "../services/types-messages.service.js";
import {
  createTypeMessageSchema,
  updateTypeMessageSchema,
  typeMessageIdSchema,
} from "@clubmanager/types/validators";
import { z } from "zod";
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Factory pour créer des handlers avec injection de dépendances
 * Permet de passer un service mocké pour les tests
 */
export const createTypesMessagesHandlers = (
  service: TypesMessagesService = typesMessagesService,
) => ({
  getAllTypesMessages: async (req: Request, res: Response) => {
    try {
      console.log(
        "📋 [TypesMessagesHandler] Récupération de tous les types de messages",
      );

      const result = await service.getAllTypesMessages();

      if (!result.success) {
        throw new NotFoundError(
          result.message || "Types de messages non trouvés",
        );
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        count: result.count,
      });
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesHandler] Erreur getAllTypesMessages:",
        error,
      );
      throw new InternalServerError(
        "Erreur lors de la récupération des types de messages",
      );
    }
  },

  createTypeMessage: async (req: Request, res: Response) => {
    try {
      console.log(
        "➕ [TypesMessagesHandler] Création d'un nouveau type de message",
      );

      // Validation des données avec Zod
      const validatedData = createTypeMessageSchema.parse(req.body);

      const result = await service.createTypeMessage(
        validatedData.title,
        validatedData.content,
      );

      if (!result.success) {
        throw new DatabaseError(
          result.message || "Erreur lors de la création du type de message",
        );
      }

      res.status(201).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesHandler] Erreur createTypeMessage:",
        error,
      );

      // Erreur de validation Zod
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Données invalides",
          formatZodErrors(error.errors),
        );
      }

      throw new InternalServerError(
        "Erreur lors de la création du type de message",
      );
    }
  },

  updateTypeMessage: async (req: Request, res: Response) => {
    try {
      console.log(
        "✏️ [TypesMessagesHandler] Modification d'un type de message:",
        req.params.id,
      );

      // Validation de l'ID
      const { id } = typeMessageIdSchema.parse(req.params);

      // Validation des données
      const validatedData = updateTypeMessageSchema.parse(req.body);

      const result = await service.updateTypeMessage(
        id,
        validatedData.title!,
        validatedData.content!,
      );

      if (!result.success) {
        throw new NotFoundError(result.message || "Type de message non trouvé");
      }

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesHandler] Erreur updateTypeMessage:",
        error,
      );

      // Erreur de validation Zod
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Données invalides",
          formatZodErrors(error.errors),
        );
      }

      throw new InternalServerError(
        "Erreur lors de la modification du type de message",
      );
    }
  },

  deleteTypeMessage: async (req: Request, res: Response) => {
    try {
      console.log(
        "🗑️ [TypesMessagesHandler] Suppression d'un type de message:",
        req.params.id,
      );

      // Validation de l'ID
      const { id } = typeMessageIdSchema.parse(req.params);

      const result = await service.deleteTypeMessage(id);

      if (!result.success) {
        throw new NotFoundError(result.message || "Type de message non trouvé");
      }

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesHandler] Erreur deleteTypeMessage:",
        error,
      );

      // Erreur de validation Zod
      if (error instanceof z.ZodError) {
        throw new ValidationError("ID invalide", formatZodErrors(error.errors));
      }

      throw new InternalServerError(
        "Erreur lors de la suppression du type de message",
      );
    }
  },

  getTypeMessageById: async (req: Request, res: Response) => {
    try {
      console.log(
        "🔍 [TypesMessagesHandler] Récupération d'un type de message:",
        req.params.id,
      );

      // Validation de l'ID
      const { id } = typeMessageIdSchema.parse(req.params);

      const result = await service.getTypeMessageById(id);

      if (!result.success) {
        throw new NotFoundError(result.message || "Type de message non trouvé");
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error: any) {
      console.error(
        "❌ [TypesMessagesHandler] Erreur getTypeMessageById:",
        error,
      );

      // Erreur de validation Zod
      if (error instanceof z.ZodError) {
        throw new ValidationError("ID invalide", formatZodErrors(error.errors));
      }

      throw new InternalServerError(
        "Erreur lors de la récupération du type de message",
      );
    }
  },
});

// Export des handlers par défaut (avec le service singleton)
const defaultHandlers = createTypesMessagesHandlers();

export const getAllTypesMessages = defaultHandlers.getAllTypesMessages;
export const createTypeMessage = defaultHandlers.createTypeMessage;
export const updateTypeMessage = defaultHandlers.updateTypeMessage;
export const deleteTypeMessage = defaultHandlers.deleteTypeMessage;
export const getTypeMessageById = defaultHandlers.getTypeMessageById;
