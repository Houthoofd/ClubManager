/**
 * 🔧 Service - Activities
 *
 * Logique métier pour activities
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class ActivitiesService {
  /**
   * Récupère tous les activities
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.activitiesWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.activities.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un activitie par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.activitiesWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.activities.findFirst({ where });
  }

  /**
   * Crée un nouveau activitie
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.activities.create({
      data,
    });
  }

  /**
   * Met à jour un activitie
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Activities avec l'ID ${id} introuvable`);
    }

    return await prisma.activities.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un activitie
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Activities avec l'ID ${id} introuvable`);
    }

    await prisma.activities.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de activities
   */
  async count(filters?: any) {
    return await prisma.activities.count({
      where: filters,
    });
  }
}

export default ActivitiesService;
