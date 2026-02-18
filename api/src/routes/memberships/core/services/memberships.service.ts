/**
 * 🔧 Service - Memberships
 *
 * Logique métier pour memberships
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class MembershipsService {
  /**
   * Récupère tous les memberships
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.membershipsWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.memberships.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un membership par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.membershipsWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.memberships.findFirst({ where });
  }

  /**
   * Crée un nouveau membership
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.memberships.create({
      data,
    });
  }

  /**
   * Met à jour un membership
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Memberships avec l'ID ${id} introuvable`);
    }

    return await prisma.memberships.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un membership
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Memberships avec l'ID ${id} introuvable`);
    }

    await prisma.memberships.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de memberships
   */
  async count(filters?: any) {
    return await prisma.memberships.count({
      where: filters,
    });
  }
}

export default MembershipsService;
