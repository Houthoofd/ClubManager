/**
 * Types pour le client S3
 */

export interface S3UploadOptions {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
  tags?: Record<string, string>;
}

export interface S3UploadResult {
  success: boolean;
  key?: string;
  bucket?: string;
  location?: string;
  etag?: string;
  versionId?: string;
  error?: string;
}

export interface S3DeleteOptions {
  bucket: string;
  key: string;
}

export interface S3DeleteResult {
  success: boolean;
  error?: string;
}

export interface S3GetUrlOptions {
  bucket: string;
  key: string;
  expiresIn?: number; // Secondes (défaut: 3600)
}

export interface S3ListOptions {
  bucket: string;
  prefix?: string;
  maxKeys?: number;
}

export interface S3FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}

export interface ImageProcessOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number; // 1-100
  grayscale?: boolean;
  blur?: number;
}

export interface ImageProcessResult {
  success: boolean;
  buffer?: Buffer;
  format?: string;
  width?: number;
  height?: number;
  size?: number;
  error?: string;
}

export type S3FileType = 
  | 'profile-picture'
  | 'article-image'
  | 'certificate'
  | 'document'
  | 'gallery'
  | 'other';

export interface S3FileUploadRequest {
  file: Buffer | Uint8Array;
  fileName: string;
  fileType: S3FileType;
  userId?: number;
  articleId?: number;
  metadata?: Record<string, string>;
  processImage?: ImageProcessOptions;
}
