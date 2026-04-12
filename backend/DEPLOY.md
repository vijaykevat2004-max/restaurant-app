# ServeFlow Backend - Railway Deployment

## Quick Deploy

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repo
3. Add environment variables (see below)
4. Deploy!

## Required Environment Variables

```
DATABASE_URL=postgresql://user:password@host:5432/serveflow
JWT_SECRET=your-super-secret-jwt-key-production
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app

# Payment Gateways (optional for testing)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
PAYTM_MID=your-paytm-mid
PAYTM_MERCANT_KEY=your-paytm-key

# Cloudinary (optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Database

Railway provides a PostgreSQL plugin. Create a new PostgreSQL database and copy the connection string to `DATABASE_URL`.

## After Deploy

1. Update `vercel.json` in frontend with your Railway backend URL
2. Update CORS settings in `backend/src/index.ts` to allow your Vercel frontend
