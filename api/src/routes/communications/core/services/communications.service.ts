/**
 * 🔧 Service - Communications
 *
 * Logique métier pour communications
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class CommunicationsService {
  /**
   * Récupère tous les communications
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.communicationsWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.communications.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un communication par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.communicationsWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.communications.findFirst({ where });
  }

  /**
   * Crée un nouveau communication
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.communications.create({
      data,
    });
  }

  /**
   * Met à jour un communication
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Communications avec l'ID ${id} introuvable`);
    }

    return await prisma.communications.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un communication
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Communications avec l'ID ${id} introuvable`);
    }

    await prisma.communications.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de communications
   */
  async count(filters?: any) {
    return await prisma.communications.count({
      where: filters,
    });
  }
}

export default CommunicationsService;
