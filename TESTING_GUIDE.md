# Fedai Multi-Provider AI Testing Guide

## Test Environment

The application is now running in Docker containers:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Redis**: localhost:6379

## Prerequisites for Testing

### 1. Google Gemini Provider
- Get API key from: https://aistudio.google.com/apikey
- Free tier available
- Models to test: `gemini-2.0-flash-exp`, `gemini-1.5-pro`, `gemini-1.5-flash`

### 2. OpenRouter Provider
- Get API key from: https://openrouter.ai/keys
- Some free models available (look for `:free` suffix)
- Recommended free model: `google/gemini-2.0-flash-exp:free`
- Paid models: Claude, GPT-4 Vision, Llama 3.2 Vision, etc.

### 3. Local OpenAI-Compatible Provider
Requires local AI server running. Options:

**LM Studio** (Recommended for beginners):
- Download from: https://lmstudio.ai/
- Start server on default port 1234
- Base URL: `http://localhost:1234/v1`

**llama.cpp**:
```bash
./server -m model.gguf --port 8080
```
Base URL: `http://localhost:8080/v1`

**KoboldCpp**:
```bash
python koboldcpp.py model.gguf --port 5001
```
Base URL: `http://localhost:5001/v1`

## Test Plan

### Phase 1: UI and Settings Tests

#### Test 1.1: Open AI Settings Modal
1. Navigate to http://localhost:5173
2. Click the robot icon (🤖) in the top-right header
3. **Expected**: AI Settings modal opens
4. **Verify**:
   - Three provider options visible (Google Gemini, OpenRouter, Local OpenAI-Compatible)
   - Default provider is "gemini"

#### Test 1.2: Provider Selection
1. Click each provider option
2. **Expected**:
   - Gemini: Shows API key field, link to Google AI Studio
   - OpenRouter: Shows API key field, link to OpenRouter
   - Local OpenAI: Shows base URL field and quick presets (LM Studio, llama.cpp, etc.)

### Phase 2: Google Gemini Provider Tests

#### Test 2.1: Invalid API Key
1. Open AI Settings
2. Select "Google Gemini"
3. Enter invalid API key: `test123`
4. Click "Test Connection"
5. **Expected**: Error message "API provider configuration invalid: ..."

#### Test 2.2: Valid API Key - Model Fetching
1. Enter your valid Gemini API key
2. Wait for models to load
3. **Expected**:
   - Loading spinner appears briefly
   - Model dropdown shows 3 options:
     - Gemini 2.0 Flash (Experimental)
     - Gemini 1.5 Pro
     - Gemini 1.5 Flash
4. Click "Test Connection"
5. **Expected**: Success message "Gemini API is accessible"

#### Test 2.3: Plant Analysis with Gemini
1. Save settings with valid API key
2. Close modal
3. On main page, click "Start Diagnosis"
4. Upload a plant image (any plant photo)
5. Add description: "My tomato plant has yellow leaves"
6. Select location and enable weather/soil data if desired
7. Click "Analyze"
8. **Expected**:
   - Analysis starts
   - Results show disease information, treatment recommendations
   - Response includes `aiProvider: "gemini"` and `aiModel: "gemini-2.0-flash-exp"`

#### Test 2.4: Model Selection
1. Open AI Settings
2. Change model to "gemini-1.5-pro"
3. Save settings
4. Run another analysis
5. **Expected**: Analysis uses the selected model

### Phase 3: OpenRouter Provider Tests

#### Test 3.1: Model List Fetching
1. Open AI Settings
2. Select "OpenRouter"
3. Enter your OpenRouter API key
4. Wait for models to load
5. **Expected**:
   - Loading spinner appears
   - Long list of vision-capable models
   - Free models appear first (with "(Free)" label)
   - Examples: Gemini 2.0 Flash (Free), Llama 3.2 90B Vision, Qwen 2 VL 72B
6. Click "Test Connection"
7. **Expected**: Success message

#### Test 3.2: Free Model Analysis
1. Select `google/gemini-2.0-flash-exp:free` from model dropdown
2. Save settings
3. Run plant analysis
4. **Expected**:
   - Analysis completes successfully
   - Response shows `aiProvider: "openrouter"`
   - No charges to your account (free model)

#### Test 3.3: Manual Model Entry
1. Open AI Settings
2. In model section, click "Enter manually"
3. Type a model name: `anthropic/claude-3.5-sonnet`
4. Save settings
5. **Expected**:
   - Settings saved with custom model
   - Analysis uses the manually entered model

#### Test 3.4: API Error Handling
1. Enter invalid API key
2. Try to fetch models
3. **Expected**: Error message displayed, fallback to manual entry

### Phase 4: Local OpenAI Provider Tests

**Note**: These tests require a local AI server running.

#### Test 4.1: Connection Test (No Server)
1. Open AI Settings
2. Select "Local OpenAI-Compatible"
3. Keep default URL: `http://localhost:1234/v1`
4. Click "Test Connection"
5. **Expected**: Error message "Cannot connect to http://localhost:1234/v1. Make sure your local AI server is running."

#### Test 4.2: Quick Presets
1. Click preset buttons (LM Studio, llama.cpp, KoboldCpp)
2. **Expected**: Base URL changes to preset value
   - LM Studio: `http://localhost:1234/v1`
   - llama.cpp: `http://localhost:8080/v1`
   - KoboldCpp: `http://localhost:5001/v1`

#### Test 4.3: Connection Test (With Server)
**Prerequisites**: Start LM Studio or another local server

1. Ensure LM Studio is running on port 1234
2. Select "LM Studio" preset
3. Click "Test Connection"
4. **Expected**: Success message "Connected to local AI at http://localhost:1234/v1"

#### Test 4.4: Model Detection
1. With local server running
2. Wait for models to load
3. **Expected**: Dropdown shows models available from local server
4. If no models detected: Manual entry field shown as fallback

#### Test 4.5: Local Analysis
**Prerequisites**: Local server with vision-capable model loaded

1. Select local provider
2. Select or enter model name
3. Save settings
4. Run plant analysis
5. **Expected**:
   - Analysis works with local model
   - Response shows `aiProvider: "local-openai"`
   - No API calls to external services

### Phase 5: Error Handling Tests

#### Test 5.1: Network Timeout
1. Set valid API key
2. Start analysis
3. Disable network during analysis
4. **Expected**: Timeout error displayed gracefully

#### Test 5.2: Invalid Model Name
1. Manually enter non-existent model: `fake-model-123`
2. Try analysis
3. **Expected**: Error "Invalid model specified or model not found"

#### Test 5.3: Rate Limiting
1. Run 10 analyses in quick succession
2. **Expected**: Backend rate limiting kicks in after 100 requests/15min
3. Error message: "Too many requests from this IP"

#### Test 5.4: Malformed API Response
1. Use provider with unstable connection
2. **Expected**: "AI response was not valid JSON" error handled gracefully

### Phase 6: Persistence Tests

#### Test 6.1: Settings Persistence
1. Configure AI settings (provider, API key, model)
2. Save settings
3. Refresh browser page
4. Open AI Settings modal
5. **Expected**: All settings retained from localStorage

#### Test 6.2: Clear Settings
1. Configure settings
2. Clear browser localStorage
3. Refresh page
4. **Expected**: Settings reset to defaults (Gemini provider, no API key)

### Phase 7: UI/UX Tests

#### Test 7.1: Loading States
1. Enter API key
2. Watch for loading spinners during:
   - Provider list fetch
   - Model list fetch
   - Connection test
3. **Expected**: Smooth loading indicators, no UI jumping

#### Test 7.2: Model Description Display
1. Select OpenRouter provider
2. Choose a model from dropdown
3. **Expected**: Model description appears below dropdown

#### Test 7.3: Manual Entry Toggle
1. With models loaded, click "Enter manually"
2. **Expected**: Dropdown changes to text input
3. Click "Show list"
4. **Expected**: Returns to dropdown

#### Test 7.4: Mobile Responsiveness
1. Resize browser to mobile width (375px)
2. Open AI Settings modal
3. **Expected**: Modal fits screen, all controls accessible

## Test Results Template

```markdown
## Test Results - [Date]

### Provider Tests
- [ ] Google Gemini - Model fetching: PASS/FAIL
- [ ] Google Gemini - Plant analysis: PASS/FAIL
- [ ] OpenRouter - Model fetching: PASS/FAIL
- [ ] OpenRouter - Plant analysis: PASS/FAIL
- [ ] Local OpenAI - Connection test: PASS/FAIL
- [ ] Local OpenAI - Plant analysis: PASS/FAIL (if local server available)

### Model Selection
- [ ] Dropdown model selection: PASS/FAIL
- [ ] Manual model entry: PASS/FAIL
- [ ] Model persistence: PASS/FAIL

### Error Handling
- [ ] Invalid API key: PASS/FAIL
- [ ] Network errors: PASS/FAIL
- [ ] Invalid model: PASS/FAIL
- [ ] Rate limiting: PASS/FAIL

### UI/UX
- [ ] Settings persistence: PASS/FAIL
- [ ] Loading states: PASS/FAIL
- [ ] Mobile responsiveness: PASS/FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Any additional observations]
```

## Docker Commands for Testing

```bash
# View logs
docker logs fedai-frontend-dev-1 -f
docker logs fedai-backend-dev-1 -f

# Restart containers
docker-compose -f docker-compose.dev.yml restart

# Stop containers
docker-compose -f docker-compose.dev.yml down

# Rebuild and start
docker-compose -f docker-compose.dev.yml up --build

# Check container status
docker-compose -f docker-compose.dev.yml ps
```

## API Endpoint Tests (Backend)

You can test backend endpoints directly with curl:

```bash
# Get available providers
curl http://localhost:3001/api/gemini-proxy/providers

# Check status
curl "http://localhost:3001/api/gemini-proxy/status?aiProvider=gemini&aiApiKey=YOUR_KEY"

# Get models
curl "http://localhost:3001/api/gemini-proxy/models?aiProvider=gemini&aiApiKey=YOUR_KEY"

# Test analysis
curl -X POST http://localhost:3001/api/gemini-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "image": {"base64": "BASE64_STRING", "mimeType": "image/jpeg"},
    "language": {"geminiPromptLanguage": "English"},
    "aiProvider": "gemini",
    "aiApiKey": "YOUR_KEY"
  }'
```

## Success Criteria

All tests should pass with:
- ✅ Settings modal opens and closes smoothly
- ✅ All three providers can be selected
- ✅ Models load correctly for each provider
- ✅ Plant analysis works with at least 2 providers (Gemini + one other)
- ✅ Model selection persists across page reloads
- ✅ Error messages are clear and helpful
- ✅ No console errors in browser dev tools
- ✅ No 500 errors in backend logs

## Known Limitations

1. **Gemini API**: No official models list endpoint - using curated list
2. **Local AI**: Requires manual server setup - not all models support vision
3. **OpenRouter**: Some models require credits even with API key
4. **Rate Limiting**: Backend limits 100 requests per 15 minutes per IP

## Next Steps After Testing

1. Document all test results
2. Fix any critical bugs found
3. Create user documentation
4. Consider adding:
   - Model cost information display
   - Response time tracking
   - Provider comparison feature
   - API usage statistics
