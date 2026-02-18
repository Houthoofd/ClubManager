/**
 * 🔧 Service - Documents
 *
 * Logique métier pour documents
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class DocumentsService {
  /**
   * Récupère tous les documents
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.documentsWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.documents.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un document par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.documentsWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.documents.findFirst({ where });
  }

  /**
   * Crée un nouveau document
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.documents.create({
      data,
    });
  }

  /**
   * Met à jour un document
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Documents avec l'ID ${id} introuvable`);
    }

    return await prisma.documents.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un document
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Documents avec l'ID ${id} introuvable`);
    }

    await prisma.documents.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de documents
   */
  async count(filters?: any) {
    return await prisma.documents.count({
      where: filters,
    });
  }
}

export default DocumentsService;
