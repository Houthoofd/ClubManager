/**
 * Upload Service
 * Handles file uploads to S3, presigned URLs, and image processing
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type {
  FileUploadInput,
  FileUploadResult,
  PresignedUrlRequest,
  PresignedUrlResponse,
  ImageProcessingOptions,
  ProcessedImage,
} from '@clubmanager/types';
import prisma from '../../../../config/database.js';

const S3_BUCKET = process.env.S3_BUCKET || 'clubmanager-uploads';
const S3_REGION = process.env.S3_REGION || 'eu-west-1';
const PRESIGNED_URL_EXPIRY = 900; // 15 minutes

export class UploadService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    input: FileUploadInput,
    userId: number
  ): Promise<FileUploadResult> {
    const key = this.generateS3Key(input.filename);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: input.file,
      ContentType: input.mimetype,
      Metadata: {
        uploadedBy: userId.toString(),
      },
    });

    await this.s3Client.send(command);

    // Save document record
    const document = await prisma.documents.create({
      data: {
        title: input.title || input.filename,
        description: input.description,
        file_url: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`,
        file_name: input.filename,
        file_type: input.mimetype,
        file_size: input.size,
        category: input.category || 'other',
        visibility: input.visibility || 'members',
        uploaded_by: userId,
      },
    });

    return {
      id: document.id,
      url: document.file_url,
      key,
      bucket: S3_BUCKET,
      filename: input.filename,
      mimetype: input.mimetype,
      size: input.size,
      uploadedAt: document.created_at?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Generate presigned URL for direct upload
   */
  async generatePresignedUrl(
    request: PresignedUrlRequest,
    userId: number
  ): Promise<PresignedUrlResponse> {
    const key = this.generateS3Key(request.filename);
    const expiresIn = request.expiresIn || PRESIGNED_URL_EXPIRY;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: request.mimetype,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    return {
      url,
      key,
      bucket: S3_BUCKET,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Process and upload image with variants
   */
  async processAndUploadImage(
    input: FileUploadInput,
    userId: number,
    options?: ImageProcessingOptions
  ): Promise<ProcessedImage> {
    // Upload original
    const original = await this.uploadFile(input, userId);

    const variants: Record<string, FileUploadResult> = {};

    // Generate thumbnail
    if (this.isImage(input.mimetype)) {
      const thumbnailBuffer = await sharp(input.file as Buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnail = await this.uploadFile(
        {
          ...input,
          file: thumbnailBuffer,
          filename: `thumb_${input.filename}`,
          size: thumbnailBuffer.length,
        },
        userId
      );

      // Process additional variants if options provided
      if (options?.resize) {
        const resizedBuffer = await sharp(input.file as Buffer)
          .resize(options.resize.width, options.resize.height, {
            fit: options.resize.fit || 'cover',
          })
          .toFormat(options.format || 'jpeg', { quality: options.quality || 85 })
          .toBuffer();

        variants.resized = await this.uploadFile(
          {
            ...input,
            file: resizedBuffer,
            filename: `resized_${input.filename}`,
            size: resizedBuffer.length,
          },
          userId
        );
      }

      return {
        original,
        thumbnail,
        variants,
      };
    }

    return {
      original,
      variants,
    };
  }

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(documentId: number, expiresIn = 3600): Promise<string> {
    const document = await prisma.documents.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Extract key from URL
    const url = new URL(document.file_url);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateS3Key(filename: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const ext = filename.split('.').pop();
    return `uploads/${timestamp}-${uuid}.${ext}`;
  }

  private isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }
}

export default new UploadService();
