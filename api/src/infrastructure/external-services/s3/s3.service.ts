/**
 * S3 Service - Wrapper haut niveau pour les opérations S3
 *
 * Ce service fournit une interface simplifiée pour les opérations
 * courantes avec AWS S3 (upload, download, delete, etc.)
 */

import { s3Client } from "./s3-client.js";
import { imageProcessor } from "./image-processor.js";
import type { S3UploadResult } from "@clubmanager/types";

export class S3Service {
  private defaultBucket: string;

  constructor() {
    this.defaultBucket = s3Client.getDefaultBucket();
  }

  /**
   * Upload un fichier sur S3
   */
  async uploadFile(
    file: Buffer | string,
    key: string,
    options?: {
      contentType?: string;
      bucket?: string;
      metadata?: Record<string, string>;
      acl?: "private" | "public-read";
    },
  ): Promise<S3UploadResult> {
    return s3Client.upload({
      key,
      body: file,
      bucket: options?.bucket || this.defaultBucket,
      contentType: options?.contentType,
      metadata: options?.metadata,
      acl: options?.acl,
    });
  }

  /**
   * Upload une image avec traitement (resize, compression)
   */
  async uploadImage(
    imageBuffer: Buffer,
    key: string,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      bucket?: string;
      acl?: "private" | "public-read";
    },
  ): Promise<S3UploadResult> {
    try {
      console.log(`🖼️ [S3Service] Processing image: ${key}`);

      // Traiter l'image (resize, compression)
      const processedResult = await imageProcessor.processImage(imageBuffer, {
        width: options?.maxWidth || 1920,
        height: options?.maxHeight || 1080,
        fit: "inside",
        quality: options?.quality || 80,
      });

      if (!processedResult.success || !processedResult.buffer) {
        throw new Error(processedResult.error || "Image processing failed");
      }

      // Upload l'image traitée
      return await this.uploadFile(processedResult.buffer, key, {
        contentType: "image/jpeg",
        bucket: options?.bucket,
        acl: options?.acl || "public-read",
        metadata: {
          processed: "true",
          maxWidth: String(options?.maxWidth || 1920),
          maxHeight: String(options?.maxHeight || 1080),
        },
      });
    } catch (error: any) {
      console.error("❌ [S3Service] Upload image error:", error);
      throw error;
    }
  }

  /**
   * Supprime un fichier de S3
   */
  async deleteFile(
    key: string,
    bucket?: string,
  ): Promise<{ success: boolean; error?: string }> {
    return s3Client.delete({
      key,
      bucket: bucket || this.defaultBucket,
    });
  }

  /**
   * Génère une URL signée pour accéder à un fichier privé
   */
  async getSignedUrl(
    key: string,
    expiresIn?: number,
    bucket?: string,
  ): Promise<string> {
    return s3Client.getSignedUrl({
      key,
      bucket: bucket || this.defaultBucket,
      expiresIn: expiresIn || 3600,
    });
  }

  /**
   * Récupère l'URL publique d'un fichier
   */
  getPublicUrl(key: string, bucket?: string): string {
    return s3Client.getPublicUrl(bucket || this.defaultBucket, key);
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(key: string, bucket?: string): Promise<boolean> {
    return s3Client.fileExists(bucket || this.defaultBucket, key);
  }

  /**
   * Liste les fichiers avec un préfixe donné
   */
  async listFiles(
    prefix: string,
    options?: {
      bucket?: string;
      maxKeys?: number;
    },
  ) {
    return s3Client.listFiles({
      bucket: options?.bucket || this.defaultBucket,
      prefix,
      maxKeys: options?.maxKeys,
    });
  }

  /**
   * Génère une clé unique pour un fichier utilisateur
   */
  generateUserFileKey(
    userId: number,
    fileType: "avatar" | "document" | "image" | "other",
    fileName: string,
  ): string {
    return s3Client.generateKey(fileType, userId, fileName);
  }

  /**
   * Upload un avatar utilisateur
   */
  async uploadUserAvatar(
    userId: number,
    imageBuffer: Buffer,
    fileName: string,
  ): Promise<S3UploadResult> {
    const key = this.generateUserFileKey(userId, "avatar", fileName);

    return this.uploadImage(imageBuffer, key, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 85,
      acl: "public-read",
    });
  }

  /**
   * Upload une image de produit
   */
  async uploadProductImage(
    productId: number,
    imageBuffer: Buffer,
    fileName: string,
  ): Promise<S3UploadResult> {
    const key = `products/product-${productId}/${Date.now()}-${fileName}`;

    return this.uploadImage(imageBuffer, key, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85,
      acl: "public-read",
    });
  }

  /**
   * Supprime tous les fichiers d'un utilisateur
   */
  async deleteUserFiles(userId: number): Promise<number> {
    try {
      const files = await this.listFiles(`user-${userId}/`);

      let deletedCount = 0;
      for (const file of files) {
        const result = await this.deleteFile(file.key);
        if (result.success) {
          deletedCount++;
        }
      }

      console.log(
        `✅ [S3Service] Deleted ${deletedCount} files for user ${userId}`,
      );
      return deletedCount;
    } catch (error: any) {
      console.error("❌ [S3Service] Delete user files error:", error);
      throw error;
    }
  }
}

// Instance singleton
export const s3Service = new S3Service();

// Export des types
export type { S3UploadResult };
