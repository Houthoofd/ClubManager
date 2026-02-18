/**
 * 🔧 Service - Settings
 *
 * Logique métier pour settings
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class SettingsService {
  /**
   * Récupère tous les settings
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.settingsWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.settings.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un setting par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.settingsWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.settings.findFirst({ where });
  }

  /**
   * Crée un nouveau setting
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.settings.create({
      data,
    });
  }

  /**
   * Met à jour un setting
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Settings avec l'ID ${id} introuvable`);
    }

    return await prisma.settings.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un setting
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Settings avec l'ID ${id} introuvable`);
    }

    await prisma.settings.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de settings
   */
  async count(filters?: any) {
    return await prisma.settings.count({
      where: filters,
    });
  }
}

export default SettingsService;
