/**
 * Upload Resolvers
 * GraphQL resolvers for file upload operations
 */

import type {
  PresignedUrlRequest,
  ImageProcessingOptions,
} from '@clubmanager/types';
import uploadService from '../services/upload.service.js';

export const uploadResolvers = {
  Query: {
    /**
     * Generate presigned URL for direct upload to S3
     */
    generatePresignedUrl: async (
      _parent: any,
      { input }: { input: PresignedUrlRequest },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const result = await uploadService.generatePresignedUrl(input, context.user.id);

        return {
          success: true,
          message: 'Presigned URL generated successfully',
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to generate presigned URL',
        };
      }
    },

    /**
     * Get download URL for a document
     */
    getDocumentDownloadUrl: async (
      _parent: any,
      { documentId, expiresIn }: { documentId: number; expiresIn?: number },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const url = await uploadService.getDownloadUrl(documentId, expiresIn);

        return {
          success: true,
          message: 'Download URL generated successfully',
          url,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to generate download URL',
        };
      }
    },
  },

  Mutation: {
    /**
     * Upload a file to S3
     */
    uploadFile: async (
      _parent: any,
      { input }: { input: any },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const file = await input.file;
        const { createReadStream, filename, mimetype } = file;

        // Read file into buffer
        const stream = createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const fileInput = {
          file: buffer,
          filename,
          mimetype,
          size: buffer.length,
          title: input.title,
          description: input.description,
          category: input.category,
          visibility: input.visibility,
        };

        const result = await uploadService.uploadFile(fileInput, context.user.id);

        return {
          success: true,
          message: 'File uploaded successfully',
          document: result,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'File upload failed',
        };
      }
    },

    /**
     * Upload and process an image with variants
     */
    uploadImage: async (
      _parent: any,
      { input, options }: { input: any; options?: ImageProcessingOptions },
      context: any
    ) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        const file = await input.file;
        const { createReadStream, filename, mimetype } = file;

        // Check if it's an image
        if (!mimetype.startsWith('image/')) {
          throw new Error('File must be an image');
        }

        // Read file into buffer
        const stream = createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const fileInput = {
          file: buffer,
          filename,
          mimetype,
          size: buffer.length,
          title: input.title,
          description: input.description,
          category: input.category || 'photo',
          visibility: input.visibility,
        };

        const result = await uploadService.processAndUploadImage(
          fileInput,
          context.user.id,
          options
        );

        return {
          success: true,
          message: 'Image uploaded and processed successfully',
          result,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Image upload failed',
        };
      }
    },
  },
};
