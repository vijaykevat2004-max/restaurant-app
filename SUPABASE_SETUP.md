# Supabase Setup Guide

## Why Supabase?

| Feature | Without | With Supabase |
|---------|---------|---------------|
| **Database** | SQLite (local only) | PostgreSQL (cloud) |
| **Images** | Local storage (doesn't work on Vercel) | Supabase Storage |
| **Real-time** | Polling (slow) | WebSocket subscriptions |
| **Auth** | Custom JWT | Supabase Auth (secure) |

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub
4. Create new project
5. Note your **Project URL** and **API Key**

### 2. Get Supabase Credentials

1. Go to Project Settings → API
2. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role secret` (under "service_role key") → `SUPABASE_SERVICE_KEY`

### 3. Create Storage Bucket

1. Go to Storage → New bucket
2. Name: `images`
3. Set as **Public bucket**

Or run this SQL in Supabase SQL Editor:

```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Allow public access
CREATE POLICY "Public Access" ON storage.objects
FOR ALL USING (bucket_id = 'images');
```

### 4. Add to Vercel Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-from-above
```

### 5. Redeploy

Trigger a new deployment to pick up the new environment variables.

## What It Enables

- **Image uploads** - Menu item photos work on production
- **Real-time orders** - Kitchen display updates instantly
- **Scalable database** - PostgreSQL works with Vercel serverless
