# Multi-AI Provider Setup Guide

**Fedai** now supports multiple AI providers, giving you flexibility in how you run plant health analysis.

> **🔒 Security Note:** API keys are NEVER committed to the repository. They are stored in environment variables (for backend deployment) and localStorage (for frontend user settings).

---

## 🎯 Available AI Providers

### 1. **Google Gemini** (Default)
- **Requires:** API Key
- **Cost:** Free tier available, pay-as-you-go
- **Quality:** Excellent vision and analysis capabilities
- **Setup:** Get API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 2. **OpenRouter**
- **Requires:** API Key
- **Cost:** Free models available + paid models
- **Quality:** Access to multiple providers (Gemini, Claude, GPT-4, Llama, etc.)
- **Setup:** Get API key from [OpenRouter](https://openrouter.ai/keys)
- **Note:** Some models are completely free!

### 3. **Local OpenAI-Compatible API**
- **Requires:** Local server running
- **Cost:** Free (runs on your hardware)
- **Quality:** Depends on your local model
- **Supported Software:**
  - LM Studio
  - llama.cpp server
  - KoboldCpp
  - Text Generation WebUI
  - Any OpenAI-compatible API

---

## 🚀 Quick Setup

### Option 1: Using the UI (Recommended)

1. **Open AI Settings:**
   - Click the lightbulb icon (💡) in the top-right corner of the app
   - Or navigate to Settings → AI Provider

2. **Select Your Provider:**
   - Choose from: Google Gemini, OpenRouter, or Local OpenAI-Compatible

3. **Configure:**
   - **For Gemini/OpenRouter:** Enter your API key
   - **For Local AI:** Enter your local server URL (e.g., `http://localhost:1234/v1`)

4. **Test Connection:**
   - Click "Test Connection" to verify your setup

5. **Save:**
   - Click "Save" to persist your settings

### Option 2: Using Environment Variables (Backend Default)

Edit `fedai-backend-proxy/.env`:

```env
# Choose provider: gemini | openrouter | local-openai
AI_PROVIDER=gemini

# For Gemini
GEMINI_API_KEY=your_gemini_key_here

# For OpenRouter
OPENROUTER_API_KEY=your_openrouter_key_here

# For Local AI
LOCAL_AI_URL=http://localhost:1234/v1
AI_MODEL=local-model-name
```

---

## 📋 Detailed Provider Setup

### Google Gemini Setup

1. **Get API Key:**
   - Visit [Google AI Studio](https://aistudio.google.com/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key

2. **In Fedai:**
   - Select "Google Gemini" as provider
   - Paste your API key
   - Test connection
   - Save

3. **Models Available:**
   - `gemini-2.0-flash-exp` (default, recommended)
   - `gemini-1.5-pro`
   - `gemini-1.5-flash`

4. **Pricing:**
   - Free tier: 15 requests/minute, 1500 requests/day
   - [Full pricing details](https://ai.google.dev/pricing)

---

### OpenRouter Setup

1. **Get API Key:**
   - Visit [OpenRouter](https://openrouter.ai/keys)
   - Sign up or log in
   - Generate an API key
   - Copy the key

2. **In Fedai:**
   - Select "OpenRouter" as provider
   - Paste your API key
   - Optionally specify a model
   - Test connection
   - Save

3. **Recommended Free Models:**
   - `google/gemini-2.5-flash:free` (recommended, fast and completely free!)
   - `meta-llama/llama-3.2-90b-vision-instruct:free` (free)
   - `qwen/qwen-2-vl-72b-instruct:free` (free)

4. **Paid Models (Higher Quality):**
   - `x-ai/grok-2-vision-1212` (excellent vision capabilities)
   - `anthropic/claude-3.5-sonnet` (superior reasoning)
   - `openai/gpt-4o` (latest GPT-4 vision)

5. **Pricing:**
   - Free models: $0
   - Paid models: Pay per token
   - [Check pricing](https://openrouter.ai/docs#models)

---

### Local AI Setup

Running AI locally gives you complete privacy and no API costs, but requires powerful hardware.

#### Prerequisites:
- **GPU Recommended:** NVIDIA GPU with 8GB+ VRAM for vision models
- **CPU Option:** Possible but slow (24GB+ RAM recommended)
- **Storage:** 10-50GB for models

#### Option A: LM Studio (Easiest)

1. **Install LM Studio:**
   - Download from [lmstudio.ai](https://lmstudio.ai)
   - Install and open

2. **Download a Vision Model:**
   - Search for vision models in LM Studio
   - **Recommended:** `Qwen2-VL-7B-Instruct` (best quality/performance balance)
   - Alternatives: `MiniCPM-V-2.6` (smaller), `LLaVA-1.6-34B` (higher quality)

3. **Start Local Server:**
   - Go to "Local Server" tab in LM Studio
   - Load your downloaded model
   - Click "Start Server"
   - Note the URL (usually `http://localhost:1234/v1`)

4. **In Fedai:**
   - Select "Local OpenAI-Compatible" as provider
   - Click "LM Studio" preset (auto-fills URL)
   - Or manually enter: `http://localhost:1234/v1`
   - Test connection
   - Save

#### Option B: llama.cpp Server

1. **Install llama.cpp:**
   ```bash
   git clone https://github.com/ggerganov/llama.cpp
   cd llama.cpp
   make
   ```

2. **Download a GGUF model:**
   - Get vision-capable GGUF models from Hugging Face
   - Example: llava models

3. **Start server:**
   ```bash
   ./server -m /path/to/model.gguf --host 0.0.0.0 --port 8080
   ```

4. **In Fedai:**
   - Select "Local OpenAI-Compatible" as provider
   - Click "llama.cpp" preset or enter: `http://localhost:8080/v1`
   - Test connection
   - Save

#### Option C: KoboldCpp

1. **Install KoboldCpp:**
   - Download from [KoboldCpp releases](https://github.com/LostRuins/koboldcpp/releases)

2. **Download a vision model:**
   - Get GGUF vision models

3. **Start KoboldCpp:**
   ```bash
   koboldcpp --model /path/to/model.gguf --port 5001 --usecublas
   ```

4. **In Fedai:**
   - Select "Local OpenAI-Compatible" as provider
   - Click "KoboldCpp" preset or enter: `http://localhost:5001/v1`
   - Test connection
   - Save

#### Option D: Text Generation WebUI

1. **Install Text Generation WebUI:**
   - Follow [installation guide](https://github.com/oobabooga/text-generation-webui)

2. **Enable OpenAI API extension:**
   - In WebUI, go to Settings → Extensions
   - Enable "openai" extension
   - Restart

3. **Load a vision model**

4. **In Fedai:**
   - Select "Local OpenAI-Compatible" as provider
   - Enter: `http://localhost:5000/v1`
   - Test connection
   - Save

---

## 🔧 Advanced Configuration

### Custom Models

You can specify custom models in the AI Settings modal:

**For Gemini:**
- `gemini-2.0-flash-exp`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

**For OpenRouter:**
- Browse models at [OpenRouter Docs](https://openrouter.ai/docs#models)
- Use format: `provider/model-name`
- Example: `anthropic/claude-3.5-sonnet`

**For Local AI:**
- Use the model name shown in your local server
- Can be anything like: `llava-v1.6`, `bakllava`, `local-model`

### Backend Configuration

For server-side default configuration, edit `fedai-backend-proxy/.env`:

```env
# Set default provider for all requests
AI_PROVIDER=gemini

# Provider-specific keys
GEMINI_API_KEY=your_key
OPENROUTER_API_KEY=your_key

# Local AI configuration
LOCAL_AI_URL=http://localhost:1234/v1
AI_MODEL=your-model-name
```

### Frontend Override

User settings in the UI (localStorage) override backend defaults. This allows users to:
- Use their own API keys
- Switch between providers easily
- Test local AI without backend changes

---

## 🔍 Troubleshooting

### "Connection failed" Error

**For Cloud Providers (Gemini/OpenRouter):**
- Verify API key is correct
- Check if you have API credits/quota
- Ensure internet connection
- Check API status pages

**For Local AI:**
- Verify local server is running
- Check firewall settings (allow localhost connections)
- Ensure correct URL and port
- Try accessing `http://localhost:PORT/v1/models` in browser
- Check local server logs for errors

### "Model not found" Error

- Verify model name spelling
- For OpenRouter: Check model is available
- For Local AI: Ensure model is loaded in your server
- Try using default model (leave field empty)

### "Rate limit exceeded" Error

- **Gemini:** Wait or upgrade to paid tier
- **OpenRouter:** Add credits or switch to free model
- **Local AI:** No rate limits!

### Slow Performance

**Local AI:**
- Use smaller models (7B instead of 34B)
- Enable GPU acceleration (CUDA, Metal, etc.)
- Reduce context window size
- Use quantized models (Q4, Q5 instead of Q8)

**Cloud Providers:**
- Check internet connection
- Try different model
- May be service-side issue

---

## 💡 Best Practices

### Choosing a Provider

**Use Google Gemini if:**
- You want best quality
- Free tier is enough for your usage
- You don't mind cloud processing

**Use OpenRouter if:**
- You want to try multiple models
- You want some free options
- You want access to latest models

**Use Local AI if:**
- Privacy is critical
- You have no internet or poor connection
- You have powerful hardware
- You want no recurring costs

### Security Tips

1. **Never share your API keys**
2. **Don't commit API keys to git** (use `.env` files)
3. **For local AI:** Only allow localhost connections unless needed
4. **Rotate API keys periodically**
5. **Monitor your API usage and costs**

### Performance Tips

1. **Local AI:** Start with smaller models, upgrade if quality isn't enough
2. **OpenRouter:** Try free models first before paying
3. **Gemini:** Use `flash` models for faster responses
4. **Cache aggressively:** Use browser cache for repeat locations

---

## 🎓 Examples

### Example 1: Free Setup (No API Key Needed)

1. Download LM Studio
2. Download `bakllava-1-7b` model
3. Start local server
4. In Fedai, select "Local AI" and use LM Studio preset
5. Completely free plant analysis!

### Example 2: Best Quality (Paid)

1. Get Gemini API key
2. Select "Google Gemini" in Fedai
3. Enter API key
4. Use default model: `gemini-2.0-flash-exp`
5. Excellent results with reasonable pricing

### Example 3: Free Cloud (No Hardware Required)

1. Sign up for OpenRouter
2. Get free API key
3. Select "OpenRouter" in Fedai
4. Enter API key
5. Use model: `google/gemini-2.0-flash-exp:free`
6. Completely free, no local hardware needed!

---

## 🆘 Support

### Getting Help

- **Documentation:** Check `README.md` and `CLAUDE.md`
- **Issues:** Open GitHub issue
- **Community:** Join discussions

### Providing Feedback

When reporting issues, include:
- Provider used
- Model name
- Error message
- Browser console logs (F12)

---

## 🔄 Migration from Single Provider

If you were using the original single-provider setup:

1. **Backend:** Add `AI_PROVIDER=gemini` to `.env` (keeps current behavior)
2. **Frontend:** AI settings are added automatically, no changes needed
3. **Existing API keys:** Will continue to work as before

The multi-provider system is backwards compatible!

---

**Last Updated:** 2025-10-09
**Version:** 2.0.0 (Multi-Provider Support)
