/**
 * Client S3 pour gestion des fichiers sur AWS S3
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  S3UploadOptions,
  S3UploadResult,
  S3DeleteOptions,
  S3DeleteResult,
  S3GetUrlOptions,
  S3ListOptions,
  S3FileMetadata,
} from '@clubmanager/types';

export class S3ClientManager {
  private client: S3Client;
  private defaultBucket: string;
  private region: string;

  constructor(config?: {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    defaultBucket?: string;
  }) {
    this.region = config?.region || process.env.AWS_REGION || 'eu-west-1';
    this.defaultBucket = config?.defaultBucket || process.env.AWS_S3_BUCKET || 'clubmanager-files';

    this.client = new S3Client({
      region: this.region,
      credentials: config?.accessKeyId
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey!,
          }
        : undefined,
    });
  }

  /**
   * Upload un fichier sur S3
   */
  async upload(options: S3UploadOptions): Promise<S3UploadResult> {
    try {
      console.log(`📤 [S3Client] Upload: ${options.key} to bucket ${options.bucket}`);

      const command = new PutObjectCommand({
        Bucket: options.bucket,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata,
        ACL: options.acl || 'private',
        Tagging: options.tags
          ? Object.entries(options.tags)
              .map(([k, v]) => `${k}=${v}`)
              .join('&')
          : undefined,
      });

      const response = await this.client.send(command);

      const location = `https://${options.bucket}.s3.${this.region}.amazonaws.com/${options.key}`;

      console.log(`✅ [S3Client] Upload successful: ${location}`);

      return {
        success: true,
        key: options.key,
        bucket: options.bucket,
        location,
        etag: response.ETag,
        versionId: response.VersionId,
      };
    } catch (error: any) {
      console.error('❌ [S3Client] Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Supprime un fichier de S3
   */
  async delete(options: S3DeleteOptions): Promise<S3DeleteResult> {
    try {
      console.log(`🗑️ [S3Client] Delete: ${options.key} from bucket ${options.bucket}`);

      const command = new DeleteObjectCommand({
        Bucket: options.bucket,
        Key: options.key,
      });

      await this.client.send(command);

      console.log(`✅ [S3Client] Delete successful: ${options.key}`);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('❌ [S3Client] Delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Génère une URL signée pour accéder à un fichier privé
   */
  async getSignedUrl(options: S3GetUrlOptions): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: options.bucket,
        Key: options.key,
      });

      const expiresIn = options.expiresIn || 3600; // 1 heure par défaut

      const url = await getSignedUrl(this.client, command, { expiresIn });

      console.log(`🔗 [S3Client] Generated signed URL for ${options.key} (expires in ${expiresIn}s)`);

      return url;
    } catch (error: any) {
      console.error('❌ [S3Client] Get signed URL error:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL publique d'un fichier (pour fichiers avec ACL public-read)
   */
  getPublicUrl(bucket: string, key: string): string {
    return `https://${bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Liste les fichiers dans un bucket
   */
  async listFiles(options: S3ListOptions): Promise<S3FileMetadata[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: options.bucket,
        Prefix: options.prefix,
        MaxKeys: options.maxKeys || 1000,
      });

      const response = await this.client.send(command);

      if (!response.Contents) {
        return [];
      }

      return response.Contents.map((item) => ({
        key: item.Key!,
        size: item.Size!,
        lastModified: item.LastModified!,
        etag: item.ETag!,
      }));
    } catch (error: any) {
      console.error('❌ [S3Client] List files error:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Génère une clé unique pour un fichier
   */
  generateKey(fileType: string, userId?: number, fileName?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitizedFileName = fileName
      ? fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      : 'file';
    
    const userPrefix = userId ? `user-${userId}/` : '';
    
    return `${fileType}/${userPrefix}${timestamp}-${random}-${sanitizedFileName}`;
  }

  /**
   * Récupère le bucket par défaut
   */
  getDefaultBucket(): string {
    return this.defaultBucket;
  }
}

// Instance singleton
export const s3Client = new S3ClientManager();
