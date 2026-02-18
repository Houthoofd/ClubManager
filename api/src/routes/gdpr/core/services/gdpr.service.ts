/**
 * 🔧 Service - Gdpr
 *
 * Logique métier pour gdpr
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class GdprService {
  /**
   * Récupère tous les gdpr
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.gdprWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.gdpr.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un gdpr par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.gdprWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.gdpr.findFirst({ where });
  }

  /**
   * Crée un nouveau gdpr
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.gdpr.create({
      data,
    });
  }

  /**
   * Met à jour un gdpr
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Gdpr avec l'ID ${id} introuvable`);
    }

    return await prisma.gdpr.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un gdpr
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Gdpr avec l'ID ${id} introuvable`);
    }

    await prisma.gdpr.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de gdpr
   */
  async count(filters?: any) {
    return await prisma.gdpr.count({
      where: filters,
    });
  }
}

export default GdprService;
