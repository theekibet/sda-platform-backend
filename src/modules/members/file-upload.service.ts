import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as streamifier from 'streamifier';
import { Express } from 'express';

// Define a type for the file to avoid Express namespace issues
type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class FileUploadService {
  private useCloudinary: boolean;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');
    
    this.useCloudinary = !!(cloudName && apiKey && apiSecret);
    
    if (this.useCloudinary) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      console.log('✅ Cloudinary configured for file uploads');
    } else {
      console.log('⚠️ Cloudinary not configured, using local storage fallback');
    }
  }

  async uploadImage(file: MulterFile): Promise<string> {
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size cannot exceed 5MB');
    }

    if (this.useCloudinary) {
      return this.uploadToCloudinary(file);
    } else {
      return this.saveLocally(file);
    }
  }

  private async uploadToCloudinary(file: MulterFile): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profile-pictures',
          transformation: { width: 400, height: 400, crop: 'fill' },
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new BadRequestException('Failed to upload image to cloud storage'));
          } else if (!result) {
            reject(new BadRequestException('No result from Cloudinary'));
          } else {
            resolve(result.secure_url);
          }
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  private async saveLocally(file: MulterFile): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
    
    // Create directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${Date.now()}-${sanitizedName}`;
    const filepath = path.join(uploadDir, filename);
    
    await fs.writeFile(filepath, file.buffer);
    
    return `/uploads/profiles/${filename}`;
  }
}