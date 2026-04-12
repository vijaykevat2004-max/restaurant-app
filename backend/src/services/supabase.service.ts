import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ghgilnuwkbiqmdhzzznq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZ2lsbnV3a2JpcW1kaHp6em5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg5MDA3OCwiZXhwIjoyMDkxNDY2MDc4fQ.p6c9Ut9Or37IY14H-eIHc6_-ouSBAbutkW4zBoZuA1g';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export class SupabaseService {
  static async ensureBucketExists(bucket: string = 'images'): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin.storage.getBucket(bucket);
      if (error || !data) {
        await supabaseAdmin.storage.createBucket(bucket, { public: true });
      }
    } catch (e) {
      console.log('Bucket might already exist:', e);
    }
  }

  static async uploadImage(fileBuffer: Buffer, filename: string, bucket: string = 'images'): Promise<string> {
    const ext = (filename.split('.').pop() || 'png').toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    
    await this.ensureBucketExists(bucket);
    
    const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error('Failed to upload image: ' + error.message);
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  }

  static async deleteImage(path: string, bucket: string = 'images'): Promise<void> {
    const filename = path.split('/').pop() || path;
    await supabaseAdmin.storage.from(bucket).remove([filename]);
  }
}
