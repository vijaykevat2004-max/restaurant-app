import dotenv from 'dotenv';
dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },
  paytm: {
    mid: process.env.PAYTM_MID,
    merchantKey: process.env.PAYTM_MERCANT_KEY,
    website: process.env.PAYTM_WEBSITE,
    channelId: process.env.PAYTM_CHANNEL_ID,
    env: process.env.PAYTM_ENV || 'staging',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://ghgilnuwkbiqmdhzzznq.supabase.co',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZ2lsbnV3a2JpcW1kaHp6em5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg5MDA3OCwiZXhwIjoyMDkxNDY2MDc4fQ.p6c9Ut9Or37IY14H-eIHc6_-ouSBAbutkW4zBoZuA1g',
  },
};
