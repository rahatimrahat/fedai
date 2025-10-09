# Fedai - Quick Start Guide

## 🚀 Start the Application (3 steps)

### 1. Start Docker Containers
```bash
cd /path/to/fedai
docker-compose -f docker-compose.dev.yml up -d
```

Wait ~30 seconds for containers to start.

### 2. Open in Browser
```
http://localhost:5173
```

### 3. Configure AI Provider

Click the **robot icon (🤖)** in the top-right corner.

#### Option A: Google Gemini (Recommended)
1. Get free API key: https://aistudio.google.com/apikey
2. Select "Google Gemini"
3. Paste API key
4. Click "Test Connection" → Should show "✓ Success"
5. Click "Save"

#### Option B: OpenRouter (Multiple Models)
1. Get API key: https://openrouter.ai/keys
2. Select "OpenRouter"
3. Paste API key
4. Wait for models to load (~2 seconds)
5. Choose a capable model:
   - **Free:** `google/gemini-2.5-flash:free`
   - **Paid:** `x-ai/grok-2-vision-1212` or `anthropic/claude-3.5-sonnet`
6. Click "Test Connection"
7. Click "Save"

#### Option C: Local AI (Advanced)
1. Download a vision model in LM Studio:
   - **Recommended:** `Qwen2-VL-7B-Instruct` (multimodal)
   - Alternatives: `MiniCPM-V-2.6`, `LLaVA-1.6-34B`
2. Start the local server in LM Studio
3. In Fedai, select "Local OpenAI-Compatible"
4. Click "LM Studio" preset (http://localhost:1234/v1)
5. Click "Test Connection"
6. Click "Save"

## 🌿 Use the App

1. Click **"Start Diagnosis"**
2. Upload a plant photo
3. Describe the issue (optional)
4. Enable location/weather data (optional)
5. Click **"Analyze"**
6. View AI-generated diagnosis and recommendations

## 🛠 Useful Commands

### View Logs
```bash
# Frontend
docker logs fedai-frontend-dev-1 -f

# Backend
docker logs fedai-backend-dev-1 -f
```

### Restart Containers
```bash
docker-compose -f docker-compose.dev.yml restart
```

### Stop Application
```bash
docker-compose -f docker-compose.dev.yml down
```

### Run Tests
```bash
./test-app.sh
```

## 🆘 Troubleshooting

### "Connection failed" error
- **Gemini/OpenRouter**: Check your API key is valid
- **Local AI**: Make sure your local server is running
- **All**: Check your internet connection

### Models not loading
- Wait 3-5 seconds for API response
- If still loading, click "Enter manually" and type model name
- Check backend logs: `docker logs fedai-backend-dev-1 --tail 50`

### Page won't load
- Check containers are running: `docker-compose -f docker-compose.dev.yml ps`
- Restart containers: `docker-compose -f docker-compose.dev.yml restart`
- Check ports 5173 and 3001 are not in use

### App shows old version
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Clear localStorage: Open browser console → `localStorage.clear()` → Reload

## 📖 More Information

- **Full Testing Guide**: `TESTING_GUIDE.md`
- **Implementation Details**: `IMPLEMENTATION_STATUS.md`
- **Provider Setup**: `AI_PROVIDER_SETUP.md`

## ✅ Quick Verification

Run this to verify everything is working:
```bash
./test-app.sh
```

Expected output:
```
✓ Frontend is accessible
✓ Backend is running
✓ Found 6 providers
✓ Found 3 Gemini models
```

## 🎉 You're Ready!

The app is fully functional with:
- ✅ Multi-provider AI support
- ✅ Dynamic model selection
- ✅ Settings persistence
- ✅ Full error handling

**Start diagnosing plants with AI at http://localhost:5173**
