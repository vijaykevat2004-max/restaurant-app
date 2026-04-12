# ServeFlow Frontend - Vercel Deployment

## Quick Deploy

1. Go to [Vercel.com](https://vercel.com)
2. Import this GitHub repo (select `frontend` folder)
3. Framework: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy!

## After Backend Deploy

1. Update `vercel.json` rewrites with your backend URL:
```json
"rewrites": [
  { "source": "/api/v1/:path*", "destination": "https://your-backend.railway.app/api/v1/:path*" }
]
```

2. Or set environment variable:
```
VITE_API_URL=https://your-backend.railway.app/api/v1
```

## Environment Variables (Optional)

```
VITE_APP_NAME=Apna Restaurant
```
