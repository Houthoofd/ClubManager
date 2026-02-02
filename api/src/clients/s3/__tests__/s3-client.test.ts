/**
 * Tests pour S3ClientManager
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { S3ClientManager } from '../s3-client';

describe('S3ClientManager', () => {
  let s3Client: S3ClientManager;

  beforeEach(() => {
    s3Client = new S3ClientManager({
      region: 'eu-west-1',
      defaultBucket: 'test-bucket',
    });
  });

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      expect(s3Client).toBeInstanceOf(S3ClientManager);
    });

    it('should use provided config', () => {
      const client = new S3ClientManager({
        region: 'us-east-1',
        defaultBucket: 'my-bucket',
      });
      expect(client.getDefaultBucket()).toBe('my-bucket');
    });

    it('should fallback to env variables', () => {
      const originalRegion = process.env.AWS_REGION;
      const originalBucket = process.env.AWS_S3_BUCKET;

      process.env.AWS_REGION = 'ap-south-1';
      process.env.AWS_S3_BUCKET = 'env-bucket';

      const client = new S3ClientManager();
      expect(client.getDefaultBucket()).toBe('env-bucket');

      process.env.AWS_REGION = originalRegion;
      process.env.AWS_S3_BUCKET = originalBucket;
    });
  });

  describe('generateKey', () => {
    it('should generate key with fileType', () => {
      const key = s3Client.generateKey('profile-picture');
      expect(key).toMatch(/^profile-picture\//);
    });

    it('should include userId in key', () => {
      const key = s3Client.generateKey('profile-picture', 123);
      expect(key).toMatch(/^profile-picture\/user-123\//);
    });

    it('should sanitize fileName', () => {
      const key = s3Client.generateKey('document', 456, 'my file (copy).pdf');
      expect(key).toMatch(/^document\/user-456\/\d+-[a-z0-9]+-my_file__copy_.pdf$/);
    });

    it('should use default fileName if not provided', () => {
      const key = s3Client.generateKey('gallery', 789);
      expect(key).toMatch(/^gallery\/user-789\/\d+-[a-z0-9]+-file$/);
    });

    it('should generate unique keys', () => {
      const key1 = s3Client.generateKey('test');
      const key2 = s3Client.generateKey('test');
      expect(key1).not.toBe(key2);
    });
  });

  describe('getPublicUrl', () => {
    it('should generate correct public URL', () => {
      const url = s3Client.getPublicUrl('my-bucket', 'path/to/file.jpg');
      expect(url).toBe('https://my-bucket.s3.eu-west-1.amazonaws.com/path/to/file.jpg');
    });
  });

  describe('getDefaultBucket', () => {
    it('should return default bucket', () => {
      expect(s3Client.getDefaultBucket()).toBe('test-bucket');
    });
  });

  // Tests d'intégration à exécuter manuellement avec vraies credentials AWS
  describe.skip('Integration tests (requires AWS credentials)', () => {
    it('should upload file to S3', async () => {
      const result = await s3Client.upload({
        bucket: 'test-bucket',
        key: 'test/file.txt',
        body: Buffer.from('Test content'),
        contentType: 'text/plain',
      });

      expect(result.success).toBe(true);
      expect(result.key).toBe('test/file.txt');
    });

    it('should delete file from S3', async () => {
      const result = await s3Client.delete({
        bucket: 'test-bucket',
        key: 'test/file.txt',
      });

      expect(result.success).toBe(true);
    });

    it('should generate signed URL', async () => {
      const url = await s3Client.getSignedUrl({
        bucket: 'test-bucket',
        key: 'test/file.txt',
        expiresIn: 3600,
      });

      expect(url).toContain('https://');
      expect(url).toContain('X-Amz-Signature');
    });

    it('should list files', async () => {
      const files = await s3Client.listFiles({
        bucket: 'test-bucket',
        prefix: 'test/',
      });

      expect(Array.isArray(files)).toBe(true);
    });

    it('should check if file exists', async () => {
      const exists = await s3Client.fileExists('test-bucket', 'test/file.txt');
      expect(typeof exists).toBe('boolean');
    });
  });
});
