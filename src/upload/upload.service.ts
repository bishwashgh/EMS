import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

export type UploadFolder = 'venues' | 'reviews' | 'avatars';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
      this.logger.log('Cloudinary configured successfully');
    } else {
      this.logger.warn('Cloudinary not configured. Uploads will return mock URLs.');
    }
  }

  // Upload single file
  async uploadFile(
    file: Express.Multer.File,
    folder: UploadFolder,
    options?: {
      transformation?: object;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
    },
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    if (!this.isConfigured) {
      // Development mode: return mock URL
      const mockUrl = `https://res.cloudinary.com/demo/image/upload/ems/${folder}/${Date.now()}_${file.originalname}`;
      this.logger.warn(`[DEV MODE] Mock upload URL: ${mockUrl}`);
      return {
        url: mockUrl,
        publicId: `ems/${folder}/${Date.now()}`,
        format: file.mimetype.split('/')[1],
        size: file.size,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder: `ems/${folder}`,
        resource_type: options?.resourceType || 'image',
        transformation: options?.transformation || this.getDefaultTransformation(folder),
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result: UploadApiResponse) => {
          if (error) {
            this.logger.error('Cloudinary upload failed:', error);
            reject(new BadRequestException('Failed to upload file'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              size: result.bytes,
            });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: UploadFolder,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed per upload');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  // Delete file from Cloudinary
  async deleteFile(publicId: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.warn(`[DEV MODE] Mock delete for: ${publicId}`);
      return true;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      this.logger.error('Cloudinary delete failed:', error);
      return false;
    }
  }

  // Delete multiple files
  async deleteMultipleFiles(publicIds: string[]): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`[DEV MODE] Mock delete for: ${publicIds.join(', ')}`);
      return;
    }

    try {
      await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
      this.logger.error('Cloudinary bulk delete failed:', error);
    }
  }

  // Get default transformations based on folder type
  private getDefaultTransformation(folder: UploadFolder): object {
    switch (folder) {
      case 'avatars':
        return {
          width: 200,
          height: 200,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          format: 'webp',
        };
      case 'venues':
        return {
          width: 1200,
          height: 800,
          crop: 'limit',
          quality: 'auto',
          format: 'webp',
        };
      case 'reviews':
        return {
          width: 800,
          height: 600,
          crop: 'limit',
          quality: 'auto',
          format: 'webp',
        };
      default:
        return {
          quality: 'auto',
          format: 'webp',
        };
    }
  }

  // Generate optimized URL with transformations
  getOptimizedUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: string;
  }): string {
    if (!this.isConfigured) {
      return `https://res.cloudinary.com/demo/image/upload/${publicId}`;
    }

    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: options?.width,
          height: options?.height,
          crop: options?.crop || 'fill',
          quality: 'auto',
          format: 'webp',
        },
      ],
    });
  }
}
