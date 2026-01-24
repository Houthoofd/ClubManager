/**
 * Traitement d'images avec Sharp
 */

import sharp, { FormatEnum } from 'sharp';
import type { ImageProcessOptions, ImageProcessResult } from '@clubmanager/types';

export class ImageProcessor {
  /**
   * Traite une image selon les options fournies
   */
  async processImage(
    buffer: Buffer,
    options: ImageProcessOptions = {}
  ): Promise<ImageProcessResult> {
    try {
      console.log('🖼️ [ImageProcessor] Processing image with options:', options);

      let processor = sharp(buffer);

      // Obtenir les métadonnées de l'image source
      const metadata = await processor.metadata();
      console.log(`📊 [ImageProcessor] Original: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

      // Resize
      if (options.width || options.height) {
        processor = processor.resize({
          width: options.width,
          height: options.height,
          fit: options.fit || 'cover',
          withoutEnlargement: true,
        });
      }

      // Grayscale
      if (options.grayscale) {
        processor = processor.grayscale();
      }

      // Blur
      if (options.blur) {
        processor = processor.blur(options.blur);
      }

      // Format conversion
      const format = options.format || 'jpeg';
      const quality = options.quality || 80;

      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ quality });
          break;
        case 'png':
          processor = processor.png({ quality });
          break;
        case 'webp':
          processor = processor.webp({ quality });
          break;
        case 'avif':
          processor = processor.avif({ quality });
          break;
      }

      // Exécuter le traitement
      const processedBuffer = await processor.toBuffer();
      const processedMetadata = await sharp(processedBuffer).metadata();

      console.log(`✅ [ImageProcessor] Processed: ${processedMetadata.width}x${processedMetadata.height}, size: ${processedBuffer.length} bytes`);

      return {
        success: true,
        buffer: processedBuffer,
        format: processedMetadata.format,
        width: processedMetadata.width,
        height: processedMetadata.height,
        size: processedBuffer.length,
      };
    } catch (error: any) {
      console.error('❌ [ImageProcessor] Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Crée une vignette (thumbnail)
   */
  async createThumbnail(
    buffer: Buffer,
    width: number = 200,
    height: number = 200
  ): Promise<ImageProcessResult> {
    return this.processImage(buffer, {
      width,
      height,
      fit: 'cover',
      format: 'jpeg',
      quality: 75,
    });
  }

  /**
   * Optimise une image pour le web
   */
  async optimizeForWeb(
    buffer: Buffer,
    maxWidth: number = 1920,
    maxHeight: number = 1080
  ): Promise<ImageProcessResult> {
    return this.processImage(buffer, {
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      format: 'webp',
      quality: 85,
    });
  }

  /**
   * Génère plusieurs versions d'une image (original, medium, thumbnail)
   */
  async generateVariants(
    buffer: Buffer
  ): Promise<{
    original: ImageProcessResult;
    medium: ImageProcessResult;
    thumbnail: ImageProcessResult;
  }> {
    const [original, medium, thumbnail] = await Promise.all([
      this.processImage(buffer, { format: 'jpeg', quality: 90 }),
      this.processImage(buffer, { width: 800, height: 600, fit: 'inside', format: 'jpeg', quality: 80 }),
      this.createThumbnail(buffer, 200, 200),
    ]);

    return { original, medium, thumbnail };
  }

  /**
   * Valide qu'un buffer est une image valide
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.width && metadata.height && metadata.format);
    } catch {
      return false;
    }
  }

  /**
   * Obtient les métadonnées d'une image
   */
  async getMetadata(buffer: Buffer) {
    return sharp(buffer).metadata();
  }
}

// Instance singleton
export const imageProcessor = new ImageProcessor();
