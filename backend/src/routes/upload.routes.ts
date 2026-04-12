import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { SupabaseService } from '../services/supabase.service.js';
import { config } from '../config/index.js';

const router = express.Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const memoryStorage = multer.memoryStorage();
const upload = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(file.originalname.toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

const useCloudinary = !!(config.cloudinary?.cloudName && config.cloudinary?.apiKey && config.cloudinary?.apiSecret);
const useSupabase = !!(config.supabase?.url && config.supabase?.serviceKey);

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }
    
    let url: string;
    
    if (useCloudinary) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      url = await CloudinaryService.uploadImage(req.file.buffer, filename);
    } else if (useSupabase) {
      url = await SupabaseService.uploadImage(req.file.buffer, req.file.originalname);
    } else {
      const ext = path.extname(req.file.originalname);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      url = `/uploads/${filename}`;
    }
    
    res.json({ success: true, data: { url } });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed: ' + error.message });
  }
});

router.delete('/upload', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ success: false, error: 'URL is required' });
      return;
    }

    if (useSupabase) {
      const filename = url.split('/').pop();
      if (filename) {
        await SupabaseService.deleteImage(filename);
      }
    }

    res.json({ success: true, message: 'Image deleted' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: 'Delete failed: ' + error.message });
  }
});

export default router;
