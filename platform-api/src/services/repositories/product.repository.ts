import { prisma } from "../prisma/prisma.service.js";
import type { Article } from "@prisma/client";

export class ProductRepository {
  async findById(id: number): Promise<Article | null> {
    return prisma.article.findUnique({
      where: { id }
    });
  }

  async findAll(): Promise<Article[]> {
    return prisma.article.findMany();
  }

  async findByStatus(actif: boolean): Promise<Article[]> {
    return prisma.article.findMany({
      where: { actif }
    });
  }

  async create(data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article> {
    return prisma.article.create({
      data
    });
  }

  async update(id: number, data: Partial<Article>): Promise<Article> {
    return prisma.article.update({
      where: { id },
      data
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.article.delete({
      where: { id }
    });
  }

  // Méthodes pour le stock
  async getWithStock(productId: number) {
    return prisma.article.findUnique({
      where: { id: productId },
      include: { stock: true }
    });
  }

  async findLowStock(threshold: number = 5) {
    return prisma.stock.findMany({
      where: {
        quantite: { lte: threshold }
      },
      include: { article: true }
    });
  }

  async incrementStock(productId: number, quantity: number) {
    return prisma.stock.upsert({
      where: { articleId: productId },
      update: { quantite: { increment: quantity } },
      create: { articleId: productId, quantite: quantity }
    });
  }

  async decrementStock(productId: number, quantity: number) {
    return prisma.stock.update({
      where: { articleId: productId },
      data: { quantite: { decrement: quantity } }
    });
  }

  async updateStock(productId: number, quantity: number) {
    return prisma.stock.upsert({
      where: { articleId: productId },
      update: { quantite: quantity },
      create: { articleId: productId, quantite: quantity }
    });
  }

  async getTotalInventoryValue() {
    const articles = await prisma.article.findMany({
      include: { stock: true }
    });
    return articles.reduce((total, article) => {
      const stock = article.stock[0]?.quantite || 0;
      return total + (Number(article.prix) * stock);
    }, 0);
  }
}