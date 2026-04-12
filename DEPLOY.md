# Apna Restaurant - Deployment Guide

## Architecture

```
Frontend (Vercel) ──────► Backend (Railway)
    │                           │
    └── QR Code Pages ─────────► Static HTML
```

## Step 1: Deploy Backend to Railway

### Prerequisites
- [Railway](https://railway.app) account (GitHub signup)

### Steps

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository

2. **Configure Backend**
   - Railway will auto-detect Node.js
   - Set root directory: `backend`

3. **Add PostgreSQL Database**
   - Click "Add Plugin" → "PostgreSQL"
   - Railway will create `DATABASE_URL` automatically

4. **Add Environment Variables**
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `FRONTEND_URL`: Your Vercel URL (e.g., `https://apna-restaurant.vercel.app`)
   - `CLOUDINARY_*`: (Optional) For image uploads
   - `RAZORPAY_*`: (Optional) For payments
   - `PAYTM_*`: (Optional) For payments

5. **Deploy**
   - Railway will automatically build and deploy
   - Note your backend URL: `https://your-backend.up.railway.app`

## Step 2: Deploy Frontend to Vercel

### Prerequisites
- [Vercel](https://vercel.com) account (GitHub signup)

### Steps

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import this GitHub repo
   - Set root directory: `frontend`

2. **Configure Build**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables**
   - `VITE_API_URL`: Your Railway backend URL (e.g., `https://your-backend.up.railway.app/api/v1`)

4. **Deploy**
   - Vercel will deploy automatically
   - Note your frontend URL: `https://apna-restaurant.vercel.app`

## Step 3: Update Configuration

### Update Backend CORS
In `backend/src/index.ts`, add your Vercel URL to allowed origins.

### Update Frontend vercel.json
Update the `rewrites` section with your Railway URL.

## Step 4: Initialize Database

After first deployment, run:
```bash
cd backend
npx prisma db push
npx prisma db seed
```

Railway provides a shell to run these commands.

## URLs

After deployment:
- **Dashboard**: `https://your-frontend.vercel.app`
- **QR Menu**: `https://your-frontend.vercel.app/order/{restaurant-slug}`

## Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check no trailing slashes

### Database Connection
- Ensure PostgreSQL plugin is active
- Verify `DATABASE_URL` format

### Images Not Loading
- If not using Cloudinary, verify uploads folder exists
- Check CORS headers for `/uploads` route
