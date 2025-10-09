# Deployment Guide

This guide covers deploying Fedai to production environments.

---

## 🚀 Deploy to Render

Fedai is configured for easy deployment to Render using the included `render.yaml` file.

### Prerequisites

- GitHub account with your Fedai repository
- Render account (free tier available)
- API keys for services you want to use

### Step 1: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository (`rahatimrahat/fedai`)
4. Render will automatically detect `render.yaml` and show the services to deploy

### Step 2: Configure Environment Variables

Before deploying, you need to set up your API keys:

#### Required Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://aistudio.google.com/apikey) |
| `PORT` | Server port (default: 3001) | Use `3001` |

#### Optional Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `OPEN_PLANTBOOK_API_KEY` | Plant database API key | [OpenPlantBook](https://open.plantbook.io/) |

**How to Add Environment Variables in Render:**

1. Go to your service → **Environment** tab
2. Click **"Add Environment Variable"**
3. Add each variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - Click **"Add"**
4. Repeat for `OPEN_PLANTBOOK_API_KEY` (if you have one)
5. Render will automatically redeploy with the new variables

### Step 3: Deploy

1. Click **"Apply"** to create the services
2. Render will:
   - Build your backend (installs dependencies from `fedai-backend-proxy/`)
   - Deploy to a public URL
   - Automatically redeploy on future git pushes

### Step 4: Verify Deployment

Once deployed, test your backend:

```bash
# Check health endpoint (replace with your Render URL)
curl https://your-app.onrender.com/api/gemini-proxy/status
```

Expected response:
```json
{
  "status": "Gemini API is reachable",
  "timestamp": "2025-01-09T..."
}
```

---

## 🔒 Security Best Practices

### ✅ DO

- Store API keys in Render's environment variables
- Use `.env.example` as a template (never commit `.env`)
- Keep `.gitignore` updated to exclude sensitive files
- Rotate API keys if accidentally exposed

### ❌ DON'T

- Never commit API keys to Git
- Never hardcode secrets in source code
- Don't share `.env` files publicly
- Don't commit `.env.local`, `.env.production`, etc.

---

## 🌐 Environment Variable Setup by Service

### OpenPlantBook API

**Purpose:** Provides detailed plant care information (watering needs, light requirements, etc.)

**Is it required?** No - the app works without it, but plant database features won't be available.

**Your API Key:** `839a97509fe0587cebb6c7c6ab56324d63bb23bd`

**How to configure:**

1. **In Render:**
   - Go to Environment tab
   - Add: `OPEN_PLANTBOOK_API_KEY` = `839a97509fe0587cebb6c7c6ab56324d63bb23bd`

2. **For Local Development:**
   - Copy `fedai-backend-proxy/.env.example` to `fedai-backend-proxy/.env`
   - Add: `OPEN_PLANTBOOK_API_KEY=839a97509fe0587cebb6c7c6ab56324d63bb23bd`

**Code Reference:**
- Backend controller: `fedai-backend-proxy/src/api/controllers/data.controller.js:367`
- API endpoint: `GET /api/plant/:id`

---

## 🔄 Automatic Deployments

Render automatically redeploys when you push to your `main` branch on GitHub.

**Deployment triggers:**
- Push to `main` branch
- Manual deploy via Render dashboard
- Environment variable changes

**Build process:**
1. Clone repository
2. Navigate to `fedai-backend-proxy/` (defined in `render.yaml`)
3. Run `npm install`
4. Start with `npm start` (runs `node server.js`)

---

## 📊 Monitoring

### Health Checks

Render automatically monitors: `GET /api/gemini-proxy/status`

If this endpoint fails, Render will restart your service.

### Logs

View real-time logs in Render dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. See startup messages, errors, and API requests

---

## 🐛 Troubleshooting

### "Cannot find module 'express-rate-limit'"

**Cause:** Missing dependency in `package.json`

**Fix:** Already fixed in latest commit. Pull latest changes and redeploy.

### "API key not valid"

**Cause:** Environment variable not set or incorrect

**Fix:**
1. Check Render Environment tab
2. Verify `GEMINI_API_KEY` is set correctly
3. Save and redeploy

### "OpenPlantBook API key not configured"

**Cause:** `OPEN_PLANTBOOK_API_KEY` environment variable not set

**Fix:**
1. Add `OPEN_PLANTBOOK_API_KEY` in Render Environment
2. Value: `839a97509fe0587cebb6c7c6ab56324d63bb23bd`
3. Save (Render auto-redeploys)

### Build fails in wrong directory

**Cause:** `render.yaml` missing or incorrect

**Fix:** Ensure `render.yaml` has `rootDir: fedai-backend-proxy`

---

## 📱 Frontend Deployment (Optional)

Currently, Fedai backend is deployed separately. To deploy the frontend:

### Option 1: Vercel (Recommended for Vite)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Render (Uncomment in render.yaml)

Edit `render.yaml` and uncomment the frontend service block, then push to GitHub.

---

## 📚 Additional Resources

- [Render Docs](https://render.com/docs)
- [Fedai Troubleshooting Guide](./TROUBLESHOOTING.md)
- [AI Provider Setup](./AI_PROVIDER_SETUP.md)
- [OpenPlantBook API Docs](https://open.plantbook.io/docs)
