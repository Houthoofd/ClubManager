/**
 * Tests pour ImageProcessor
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ImageProcessor } from '../image-processor';
import { createCanvas } from 'canvas';

// Helper pour créer une image de test
function createTestImage(width: number = 500, height: number = 500): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Dessiner un gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#FF0000');
  gradient.addColorStop(0.5, '#00FF00');
  gradient.addColorStop(1, '#0000FF');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toBuffer('image/png');
}

describe('ImageProcessor', () => {
  let imageProcessor: ImageProcessor;
  let testImageBuffer: Buffer;

  beforeEach(() => {
    imageProcessor = new ImageProcessor();
    testImageBuffer = createTestImage(800, 600);
  });

  describe('validateImage', () => {
    it('should validate correct image buffer', async () => {
      const isValid = await imageProcessor.validateImage(testImageBuffer);
      expect(isValid).toBe(true);
    });

    it('should reject invalid buffer', async () => {
      const invalidBuffer = Buffer.from('not an image');
      const isValid = await imageProcessor.validateImage(invalidBuffer);
      expect(isValid).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return image metadata', async () => {
      const metadata = await imageProcessor.getMetadata(testImageBuffer);
      
      expect(metadata.width).toBe(800);
      expect(metadata.height).toBe(600);
      expect(metadata.format).toBe('png');
    });
  });

  describe('processImage', () => {
    it('should resize image', async () => {
      const result = await imageProcessor.processImage(testImageBuffer, {
        width: 400,
        height: 300,
        format: 'jpeg',
      });

      expect(result.success).toBe(true);
      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
      expect(result.format).toBe('jpeg');
    });

    it('should convert format', async () => {
      const result = await imageProcessor.processImage(testImageBuffer, {
        format: 'webp',
        quality: 80,
      });

      expect(result.success).toBe(true);
      expect(result.format).toBe('webp');
    });

    it('should apply quality setting', async () => {
      const highQuality = await imageProcessor.processImage(testImageBuffer, {
        format: 'jpeg',
        quality: 90,
      });

      const lowQuality = await imageProcessor.processImage(testImageBuffer, {
        format: 'jpeg',
        quality: 50,
      });

      expect(highQuality.success).toBe(true);
      expect(lowQuality.success).toBe(true);
      expect(lowQuality.size!).toBeLessThan(highQuality.size!);
    });

    it('should handle resize with different fit options', async () => {
      const cover = await imageProcessor.processImage(testImageBuffer, {
        width: 200,
        height: 200,
        fit: 'cover',
      });

      const contain = await imageProcessor.processImage(testImageBuffer, {
        width: 200,
        height: 200,
        fit: 'contain',
      });

      expect(cover.success).toBe(true);
      expect(contain.success).toBe(true);
      expect(cover.width).toBe(200);
      expect(cover.height).toBe(200);
    });
  });

  describe('createThumbnail', () => {
    it('should create thumbnail with default size', async () => {
      const result = await imageProcessor.createThumbnail(testImageBuffer);

      expect(result.success).toBe(true);
      expect(result.width).toBe(200);
      expect(result.height).toBe(200);
      expect(result.format).toBe('jpeg');
    });

    it('should create thumbnail with custom size', async () => {
      const result = await imageProcessor.createThumbnail(testImageBuffer, 100, 100);

      expect(result.success).toBe(true);
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });
  });

  describe('optimizeForWeb', () => {
    it('should optimize large image for web', async () => {
      const largeImage = createTestImage(3000, 2000);
      const result = await imageProcessor.optimizeForWeb(largeImage);

      expect(result.success).toBe(true);
      expect(result.width).toBeLessThanOrEqual(1920);
      expect(result.height).toBeLessThanOrEqual(1080);
      expect(result.format).toBe('webp');
    });

    it('should not enlarge small images', async () => {
      const smallImage = createTestImage(500, 400);
      const result = await imageProcessor.optimizeForWeb(smallImage);

      expect(result.success).toBe(true);
      expect(result.width).toBe(500);
      expect(result.height).toBe(400);
    });
  });

  describe('generateVariants', () => {
    it('should generate three variants', async () => {
      const variants = await imageProcessor.generateVariants(testImageBuffer);

      expect(variants.original.success).toBe(true);
      expect(variants.medium.success).toBe(true);
      expect(variants.thumbnail.success).toBe(true);

      // Medium should be smaller than original
      expect(variants.medium.width!).toBeLessThanOrEqual(800);
      
      // Thumbnail should be smallest
      expect(variants.thumbnail.width).toBe(200);
      expect(variants.thumbnail.height).toBe(200);
    });

    it('should have different sizes', async () => {
      const variants = await imageProcessor.generateVariants(testImageBuffer);

      expect(variants.thumbnail.size!).toBeLessThan(variants.medium.size!);
      expect(variants.medium.size!).toBeLessThanOrEqual(variants.original.size!);
    });
  });

  describe('Error handling', () => {
    it('should handle processing error gracefully', async () => {
      const invalidBuffer = Buffer.from('invalid image data');
      const result = await imageProcessor.processImage(invalidBuffer);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
