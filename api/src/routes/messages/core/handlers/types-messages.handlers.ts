import { Request, Response } from "express";
import {
  typesMessagesService,
  TypesMessagesService,
} from "../services/types-messages.service.js";
import {
  createTypeMessageSchema,
  updateTypeMessageSchema,
  typeMessageIdSchema,
} from "../validators/types-messages.schemas.js";
import { z } from "zod";

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
        return res.status(404).json({
          success: false,
          message: result.message,
          data: [],
        });
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
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des types de messages",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
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
        return res.status(400).json({
          success: false,
          message: result.message,
        });
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
        return res.status(400).json({
          success: false,
          message: "Données invalides",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la création du type de message",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
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
        return res.status(400).json({
          success: false,
          message: result.message,
        });
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
        return res.status(400).json({
          success: false,
          message: "Données invalides",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la modification du type de message",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
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
        return res.status(400).json({
          success: false,
          message: result.message,
        });
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
        return res.status(400).json({
          success: false,
          message: "ID invalide",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression du type de message",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
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
        return res.status(404).json({
          success: false,
          message: result.message,
          data: null,
        });
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
        return res.status(400).json({
          success: false,
          message: "ID invalide",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération du type de message",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
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
