/**
 * 🔧 Service - Events
 *
 * Logique métier pour events
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class EventsService {
  /**
   * Récupère tous les events
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.eventsWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.events.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un event par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.eventsWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.events.findFirst({ where });
  }

  /**
   * Crée un nouveau event
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.events.create({
      data,
    });
  }

  /**
   * Met à jour un event
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Events avec l'ID ${id} introuvable`);
    }

    return await prisma.events.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un event
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Events avec l'ID ${id} introuvable`);
    }

    await prisma.events.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de events
   */
  async count(filters?: any) {
    return await prisma.events.count({
      where: filters,
    });
  }
}

export default EventsService;
