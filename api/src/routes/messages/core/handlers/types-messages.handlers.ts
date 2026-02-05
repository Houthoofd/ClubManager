import { Request, Response } from 'express';
import { typesMessagesService } from '../services/types-messages.service.js';
import {
  createTypeMessageSchema,
  updateTypeMessageSchema,
  typeMessageIdSchema,
} from '../validators/types-messages.schemas.js';
import { z } from 'zod';

/**
 * Handler pour récupérer tous les types de messages
 *
 * @route GET /api/messages/types
 * @access Public
 */
export const getAllTypesMessages = async (req: Request, res: Response) => {
  try {
    console.log('📋 [TypesMessagesHandler] Récupération de tous les types de messages');

    const result = await typesMessagesService.getAllTypesMessages();

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
    console.error('❌ [TypesMessagesHandler] Erreur getAllTypesMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des types de messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour créer un nouveau type de message
 *
 * @route POST /api/messages/types
 * @access Protected (authentification requise)
 */
export const createTypeMessage = async (req: Request, res: Response) => {
  try {
    console.log('➕ [TypesMessagesHandler] Création d\'un nouveau type de message');

    // Validation des données avec Zod
    const validatedData = createTypeMessageSchema.parse(req.body);

    const result = await typesMessagesService.createTypeMessage(
      validatedData.title,
      validatedData.content
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
    console.error('❌ [TypesMessagesHandler] Erreur createTypeMessage:', error);

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du type de message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour modifier un type de message
 *
 * @route PUT /api/messages/types/:id
 * @access Protected (authentification requise)
 */
export const updateTypeMessage = async (req: Request, res: Response) => {
  try {
    console.log('✏️ [TypesMessagesHandler] Modification d\'un type de message:', req.params.id);

    // Validation de l'ID
    const { id } = typeMessageIdSchema.parse(req.params);

    // Validation des données
    const validatedData = updateTypeMessageSchema.parse(req.body);

    const result = await typesMessagesService.updateTypeMessage(
      id,
      validatedData.title!,
      validatedData.content!
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
    console.error('❌ [TypesMessagesHandler] Erreur updateTypeMessage:', error);

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification du type de message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour supprimer un type de message
 *
 * @route DELETE /api/messages/types/:id
 * @access Protected (authentification requise)
 */
export const deleteTypeMessage = async (req: Request, res: Response) => {
  try {
    console.log('🗑️ [TypesMessagesHandler] Suppression d\'un type de message:', req.params.id);

    // Validation de l'ID
    const { id } = typeMessageIdSchema.parse(req.params);

    const result = await typesMessagesService.deleteTypeMessage(id);

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
    console.error('❌ [TypesMessagesHandler] Erreur deleteTypeMessage:', error);

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du type de message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Handler pour récupérer un type de message par son ID
 *
 * @route GET /api/messages/types/:id
 * @access Public
 */
export const getTypeMessageById = async (req: Request, res: Response) => {
  try {
    console.log('🔍 [TypesMessagesHandler] Récupération d\'un type de message:', req.params.id);

    // Validation de l'ID
    const { id } = typeMessageIdSchema.parse(req.params);

    const result = await typesMessagesService.getTypeMessageById(id);

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
    console.error('❌ [TypesMessagesHandler] Erreur getTypeMessageById:', error);

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'ID invalide',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du type de message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
