/**
 * 🔧 Service - Statistics
 *
 * Logique métier pour statistics
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class StatisticsService {
  /**
   * Récupère tous les statistics
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.statisticsWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.statistics.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un statistic par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.statisticsWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.statistics.findFirst({ where });
  }

  /**
   * Crée un nouveau statistic
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.statistics.create({
      data,
    });
  }

  /**
   * Met à jour un statistic
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Statistics avec l'ID ${id} introuvable`);
    }

    return await prisma.statistics.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un statistic
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Statistics avec l'ID ${id} introuvable`);
    }

    await prisma.statistics.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de statistics
   */
  async count(filters?: any) {
    return await prisma.statistics.count({
      where: filters,
    });
  }
}

export default StatisticsService;
