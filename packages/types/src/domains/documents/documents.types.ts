/**
 * Generated TypeScript types for documents domain
 * @generated - Do not edit manually
 */

export interface Documents {
  id: number;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  /** Type MIME du fichier */
  file_type?: string;
  /** Taille en octets */
  file_size?: number;
  category?: "rulebook" | "photo" | "video" | "form" | "certificate" | "other";
  visibility?: "public" | "members" | "instructors" | "admins";
  uploaded_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentsInsert {
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  /** Type MIME du fichier */
  file_type?: string;
  /** Taille en octets */
  file_size?: number;
  category?: "rulebook" | "photo" | "video" | "form" | "certificate" | "other";
  visibility?: "public" | "members" | "instructors" | "admins";
  uploaded_by: number;
}

export interface DocumentsUpdate {
  title?: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  /** Type MIME du fichier */
  file_type?: string;
  /** Taille en octets */
  file_size?: number;
  category?: "rulebook" | "photo" | "video" | "form" | "certificate" | "other";
  visibility?: "public" | "members" | "instructors" | "admins";
  uploaded_by?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// File Upload Types (AWS S3, Multer)
// ============================================

export interface FileUploadInput {
  file: File | Buffer;
  filename: string;
  mimetype: string;
  size: number;
  category?: "rulebook" | "photo" | "video" | "form" | "certificate" | "other";
  visibility?: "public" | "members" | "instructors" | "admins";
  title?: string;
  description?: string;
}

export interface FileUploadResult {
  id: number;
  url: string;
  key: string;
  bucket: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

export interface S3UploadConfig {
  bucket: string;
  key: string;
  acl?: "private" | "public-read" | "public-read-write";
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface PresignedUrlRequest {
  filename: string;
  mimetype: string;
  size: number;
  expiresIn?: number;
}

export interface PresignedUrlResponse {
  url: string;
  key: string;
  bucket: string;
  expiresAt: string;
  fields?: Record<string, string>;
}

export interface UploadStatus {
  id: string;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  progress: number;
  filename: string;
  size: number;
  uploadedSize: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface MultipartUploadInit {
  uploadId: string;
  key: string;
  bucket: string;
}

export interface MultipartUploadPart {
  partNumber: number;
  etag: string;
  size: number;
}

export interface MultipartUploadComplete {
  uploadId: string;
  key: string;
  parts: MultipartUploadPart[];
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  codec?: string;
  bitrate?: number;
  checksum?: string;
}

export interface ImageProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  };
  format?: "jpeg" | "png" | "webp" | "avif";
  quality?: number;
  optimize?: boolean;
}

export interface ProcessedImage {
  original: FileUploadResult;
  thumbnail?: FileUploadResult;
  variants?: Record<string, FileUploadResult>;
}
