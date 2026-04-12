import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { config } from '../config/index.js';

cloudinary.config({
  cloud_name: config.cloudinary?.cloudName,
  api_key: config.cloudinary?.apiKey,
  api_secret: config.cloudinary?.apiSecret,
});

export class CloudinaryService {
  static async uploadImage(fileBuffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'apna-restaurant',
          public_id: filename.replace(/\.[^/.]+$/, ''),
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }
      );
      
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }
  
  static async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}

export { cloudinary };
