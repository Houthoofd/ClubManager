/**
 * 🔧 Service - Users
 *
 * Logique métier pour users
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class UsersService {
  /**
   * Récupère tous les users
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.usersWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.users.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un user par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.usersWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.users.findFirst({ where });
  }

  /**
   * Crée un nouveau user
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.users.create({
      data,
    });
  }

  /**
   * Met à jour un user
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Users avec l'ID ${id} introuvable`);
    }

    return await prisma.users.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un user
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Users avec l'ID ${id} introuvable`);
    }

    await prisma.users.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de users
   */
  async count(filters?: any) {
    return await prisma.users.count({
      where: filters,
    });
  }
}

export default UsersService;
