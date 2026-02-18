/**
 * 🔧 Service - Shop
 *
 * Logique métier pour shop
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class ShopService {
  /**
   * Récupère tous les shop
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.shopWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.shop.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un shop par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.shopWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.shop.findFirst({ where });
  }

  /**
   * Crée un nouveau shop
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.shop.create({
      data,
    });
  }

  /**
   * Met à jour un shop
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Shop avec l'ID ${id} introuvable`);
    }

    return await prisma.shop.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un shop
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Shop avec l'ID ${id} introuvable`);
    }

    await prisma.shop.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de shop
   */
  async count(filters?: any) {
    return await prisma.shop.count({
      where: filters,
    });
  }
}

export default ShopService;
