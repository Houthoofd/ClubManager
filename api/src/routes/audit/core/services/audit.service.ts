/**
 * 🔧 Service - Audit
 *
 * Logique métier pour audit
 */

import { prisma } from "@/infrastructure/database/prisma-client.js";
import { ValidationError, NotFoundError } from "@/shared/errors/index.js";
import type { Prisma } from "@prisma/client";

export class AuditService {
  /**
   * Récupère tous les audit
   */
  async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: number;
  }) {
    const { limit = 50, offset = 0, userId } = options;

    const where: Prisma.auditWhereInput = {};

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.audit.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Récupère un audit par ID
   */
  async findById(id: number, userId?: number) {
    const where: Prisma.auditWhereInput = { id };

    // Ajoutez vos filtres ici
    // if (userId) {
    //   where.userId = userId;
    // }

    return await prisma.audit.findFirst({ where });
  }

  /**
   * Crée un nouveau audit
   */
  async create(data: any) {
    // Validation des données
    if (!data) {
      throw new ValidationError("Données invalides");
    }

    return await prisma.audit.create({
      data,
    });
  }

  /**
   * Met à jour un audit
   */
  async update(id: number, data: any) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Audit avec l'ID ${id} introuvable`);
    }

    return await prisma.audit.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprime un audit
   */
  async delete(id: number, userId?: number) {
    // Vérifie que l'élément existe
    const existing = await this.findById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Audit avec l'ID ${id} introuvable`);
    }

    await prisma.audit.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Compte le nombre total de audit
   */
  async count(filters?: any) {
    return await prisma.audit.count({
      where: filters,
    });
  }
}

export default AuditService;
