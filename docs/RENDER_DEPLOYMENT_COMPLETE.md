# Complete Render Deployment Guide

## 🎯 Overview

This guide explains how to deploy both frontend and backend to Render with proper API communication.

## 🔧 Recent Fixes Applied

### Problem Fixed
The frontend was using **relative API paths** (`/api/ip-location`) which work in development (thanks to Vite proxy) but fail in production when frontend and backend are on different domains.

### Solution
Added `API_BASE_URL` configuration that:
- **Development**: Remains empty (`''`) - Vite proxy handles routing to `localhost:3001`
- **Production**: Set to backend URL - Direct API calls to backend server

## 📋 Deployment Steps

### Step 1: Push Changes to GitHub

All necessary changes have been made:
- ✅ Added `API_BASE_URL` constant in `constants.ts`
- ✅ Updated all service files to use `API_BASE_URL`
- ✅ Updated `render.yaml` with frontend configuration
- ✅ Created `.env.example` for frontend

```bash
cd /Users/barisnacierzeren/Downloads/GitHub/fedai
git add .
git commit -m "fix: Add API_BASE_URL for production deployment

- Configure API base URL for frontend-backend communication
- Update all service files (ipLocation, weather, soil, elevation, plant, gemini)
- Enable frontend deployment in render.yaml
- Add VITE_API_BASE_URL environment variable support"
git push origin main
```

### Step 2: Deploy to Render

#### Option A: Using Render Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create **2 services**:
   - `fedai-backend` - Backend API server
   - `fedai-frontend` - Frontend web app

#### Option B: Manual Deployment

**Backend:**
1. New+ → Web Service
2. Connect your repo
3. Settings:
   - Name: `fedai-backend`
   - Root Directory: `fedai-backend-proxy`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `GEMINI_API_KEY` = your_key
     - `PORT` = 3001

**Frontend:**
1. New+ → Web Service
2. Connect your repo
3. Settings:
   - Name: `fedai-frontend`
   - Root Directory: `.` (empty)
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview -- --port $PORT --host 0.0.0.0`
   - Environment Variables:
     - `NODE_ENV` = production
     - `VITE_API_BASE_URL` = `https://fedai-backend.onrender.com` (use your actual backend URL)

### Step 3: Configure Environment Variables

#### Backend Environment Variables

| Variable | Required | Value |
|----------|----------|-------|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |
| `OPEN_PLANTBOOK_API_KEY` | ❌ Optional | Your OpenPlantBook API key |
| `PORT` | ✅ Yes | `3001` |
| `NODE_ENV` | ✅ Yes | `production` |

#### Frontend Environment Variables

| Variable | Required | Value |
|----------|----------|-------|
| `NODE_ENV` | ✅ Yes | `production` |
| `VITE_API_BASE_URL` | ✅ Yes | `https://fedai-backend.onrender.com` (your backend URL) |

**Important**: If using Blueprint deployment, Render automatically sets `VITE_API_BASE_URL` to the backend's URL.

### Step 4: Verify Deployment

#### Test Backend
```bash
curl https://your-backend.onrender.com/api/ip-location
```

Expected response:
```json
{
  "latitude": 40.2344,
  "longitude": 29.0174,
  "city": "Your City",
  "country": "Your Country",
  "countryCode": "XX",
  "serviceName": "ip-api.com"
}
```

#### Test Frontend
1. Visit `https://your-frontend.onrender.com`
2. Location should load automatically
3. Upload an image to test full flow

## 🔍 How It Works

### Development (Local)
```
Frontend (localhost:5173)
    ↓ fetch('/api/ip-location')
    ↓ Vite Proxy (vite.config.ts)
    ↓
Backend (localhost:3001)
```

### Production (Render)
```
Frontend (fedai-frontend.onrender.com)
    ↓ fetch('https://fedai-backend.onrender.com/api/ip-location')
    ↓ Direct connection
    ↓
Backend (fedai-backend.onrender.com)
```

## 🐛 Troubleshooting

### Frontend shows "Failed to fetch location"

**Check 1**: Verify `VITE_API_BASE_URL` is set correctly
```bash
# In Render Dashboard → fedai-frontend → Environment
VITE_API_BASE_URL should be: https://fedai-backend.onrender.com
```

**Check 2**: Verify backend CORS allows frontend domain
```javascript
// fedai-backend-proxy/src/app.js
const allowedOrigins = [
  'https://fedai-frontend.onrender.com',  // Add your frontend URL
  // ... other origins
];
```

**Check 3**: Test backend directly
```bash
curl https://fedai-backend.onrender.com/api/ip-location
```

### Backend returns 404

**Check**: Ensure backend is running and healthy
- Visit: `https://fedai-backend.onrender.com/api/gemini-proxy/status`
- Should return: `{"status":"UP",...}`

### CORS errors in browser console

**Fix**: Add frontend URL to backend CORS whitelist

Edit `fedai-backend-proxy/src/app.js`:
```javascript
const allowedOrigins = [
  'https://fedai-frontend.onrender.com',  // Add this line
  'http://localhost:5173',
  // ... other origins
];
```

## 📚 Files Modified

| File | Change |
|------|--------|
| `constants.ts` | Added `API_BASE_URL` constant |
| `services/ipLocationService.ts` | Use `API_BASE_URL` |
| `services/weatherService.ts` | Use `API_BASE_URL` |
| `services/elevationService.ts` | Use `API_BASE_URL` |
| `services/soilApi.ts` | Use `API_BASE_URL` |
| `services/plantApi.ts` | Use `API_BASE_URL` |
| `services/geminiService.multi-provider.ts` | Use `API_BASE_URL` |
| `render.yaml` | Enabled frontend deployment |
| `.env.example` | Added frontend env template |

## 🔐 Security Notes

- ✅ API keys are stored in backend environment variables only
- ✅ Frontend never contains API keys
- ✅ CORS is configured with explicit allowed origins
- ✅ Rate limiting is enabled on backend

## ✅ Checklist

Before going live:
- [ ] Backend deployed and health check passes
- [ ] Frontend deployed successfully
- [ ] `VITE_API_BASE_URL` points to backend
- [ ] Backend CORS includes frontend URL
- [ ] Location data loads on frontend
- [ ] Image analysis works end-to-end
- [ ] All environment variables configured

## 🚀 Next Steps

After successful deployment:
1. Test full user flow (location → image upload → analysis)
2. Monitor Render logs for errors
3. Set up custom domain (optional)
4. Configure auto-deploy on git push
