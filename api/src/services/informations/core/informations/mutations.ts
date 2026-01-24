/**
 * Mutations pour le domaine Informations
 * Opérations de création/modification/suppression
 */

import { prisma } from '../../../../infrastructure/database/prisma-client.js';
import type { InformationInput, InformationResult } from '@clubmanager/types';

/**
 * Ajouter une nouvelle information
 */
export async function ajouterInformation(data: InformationInput): Promise<InformationResult> {
  try {
    const information = await prisma.informations.create({
      data: {
        titre: data.titre,
        contenu: data.contenu,
        date_creation: new Date(),
        status_id: 1
      }
    });

    return {
      success: true,
      message: 'Information ajoutée avec succès',
      data: information
    };
  } catch (error: any) {
    console.error('Erreur lors de l\'ajout de l\'information:', error);
    return {
      success: false,
      message: `Erreur lors de l'ajout: ${error.message}`
    };
  }
}

/**
 * Modifier une information existante
 */
export async function modifierInformation(id: number, data: InformationInput): Promise<InformationResult> {
  try {
    const information = await prisma.informations.findFirst({
      where: {
        id,
        status_id: 1
      }
    });

    if (!information) {
      return {
        success: false,
        message: 'Information non trouvée'
      };
    }

    const updated = await prisma.informations.update({
      where: { id },
      data: {
        titre: data.titre,
        contenu: data.contenu
      }
    });

    return {
      success: true,
      message: 'Information modifiée avec succès',
      data: updated
    };
  } catch (error: any) {
    console.error('Erreur lors de la modification de l\'information:', error);
    return {
      success: false,
      message: `Erreur lors de la modification: ${error.message}`
    };
  }
}

/**
 * Supprimer une information (soft delete)
 */
export async function supprimerInformation(id: number): Promise<InformationResult> {
  try {
    const information = await prisma.informations.findUnique({
      where: { id }
    });

    if (!information) {
      return {
        success: false,
        message: 'Information non trouvée'
      };
    }

    await prisma.informations.update({
      where: { id },
      data: {
        status_id: 0 // Soft delete
      }
    });

    return {
      success: true,
      message: 'Information supprimée avec succès'
    };
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'information:', error);
    return {
      success: false,
      message: `Erreur lors de la suppression: ${error.message}`
    };
  }
}
