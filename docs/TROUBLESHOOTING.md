# Troubleshooting: Gemini API Key Not Working

## Issue
Test Connection succeeds ✅ but Analysis fails ❌ with "API key not valid"

## Root Cause
The AI settings might not be persisting correctly or being passed to the analysis function.

## Solution Steps

### Step 1: Check Browser Console for Debug Messages

1. Open http://localhost:5173
2. Press F12 to open Developer Tools
3. Go to "Console" tab
4. Try to analyze your plant image
5. Look for messages like:
   ```
   [DEBUG] AI Settings provided: {...}
   ```
   or
   ```
   [DEBUG] No AI settings provided to analysis!
   ```

**If you see "No AI settings provided"**: The context is not passing settings correctly.

**If you see "AI Settings provided" with `apiKeyLength: 0`**: The API key is empty.

### Step 2: Manually Check localStorage

In browser console, run:
```javascript
const settings = JSON.parse(localStorage.getItem('fedai_ai_settings'));
console.log('Provider:', settings?.provider);
console.log('API Key (first 10 chars):', settings?.apiKey?.substring(0, 10));
console.log('API Key length:', settings?.apiKey?.length);
```

Expected output:
```
Provider: gemini
API Key (first 10 chars): AIzaSyBxxx
API Key length: 39
```

**If apiKey is empty or null**: Settings didn't save properly.

### Step 3: Force Save Settings

Run this in browser console (replace with your actual API key):

```javascript
localStorage.setItem('fedai_ai_settings', JSON.stringify({
  provider: 'gemini',
  apiKey: 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx', // YOUR ACTUAL KEY
  model: 'gemini-2.0-flash-exp'
}));

// Reload page
location.reload();
```

### Step 4: Verify Network Request

1. Open Developer Tools → Network tab
2. Try analysis again
3. Click on `/api/gemini-proxy` request
4. Go to "Payload" or "Request" tab
5. Check if `aiApiKey` is present and not empty

Should look like:
```json
{
  "image": {...},
  "language": {...},
  "aiProvider": "gemini",
  "aiApiKey": "AIzaSyBxxxxxxxxxxxxx",  ← Should have your key
  "aiModel": "gemini-2.0-flash-exp"
}
```

**If aiApiKey is missing or empty**: The settings are not being passed to the request.

## Alternative: Use OpenRouter (Easier & Free!)

Since Gemini is having issues, try OpenRouter which has free models:

### Quick OpenRouter Setup:

1. **Get API key** (free): https://openrouter.ai/keys

2. **Configure in app**:
   - Click robot icon 🤖
   - Select "OpenRouter"
   - Paste API key
   - Wait 2-3 seconds for models to load
   - Select: **google/gemini-2.0-flash-exp:free** (it's free!)
   - Click "Test Connection" → Should succeed
   - Click "Save"

3. **Try analysis** with your plant image

This works immediately and uses the same Gemini model through OpenRouter's API!

## Another Alternative: Local AI (If You Have GPU)

If you have a GPU and want fully local/private analysis:

1. **Download LM Studio**: https://lmstudio.ai/

2. **Get a vision model** (in LM Studio):
   - Search for: `llava-v1.6-vicuna-7b`
   - Download the Q4_K_M version (~4GB)
   - Load the model
   - Start server (port 1234)

3. **Configure in Fedai**:
   - Click robot icon
   - Select "Local OpenAI-Compatible"
   - Click "LM Studio" preset
   - Test & Save

4. **Analyze your plant** (100% local, private!)

## Quick Fix Command

If localStorage is not persisting, try this full reset:

```javascript
// Run in browser console
localStorage.clear();
location.reload();

// Then reconfigure from scratch:
// 1. Click robot icon
// 2. Select provider
// 3. Enter API key
// 4. Save
```

## Expected Behavior

### Working Flow:
1. ✅ Configure settings in modal
2. ✅ Settings saved to localStorage
3. ✅ Modal closes
4. ✅ Start analysis
5. ✅ Settings loaded from context
6. ✅ API key sent in request
7. ✅ Analysis succeeds

### Current Issue:
- ✅ Settings save to localStorage
- ✅ Test connection works
- ❌ API key not sent during analysis OR
- ❌ Settings not loaded by analysis context

## Debug Checklist

- [ ] Check browser console for debug messages
- [ ] Verify localStorage has settings (`localStorage.getItem('fedai_ai_settings')`)
- [ ] Verify API key is in localStorage and not empty
- [ ] Check Network tab for `/api/gemini-proxy` request payload
- [ ] Verify `aiApiKey` field is present in request
- [ ] Try hard refresh (Ctrl+Shift+R)
- [ ] Try clearing localStorage and reconfiguring
- [ ] Try OpenRouter as alternative

## If All Else Fails

**Use OpenRouter** - it's the most reliable option right now:
- Free models available
- Easy setup
- Same Gemini model quality
- No localStorage issues

Get key: https://openrouter.ai/keys
Model to use: `google/gemini-2.0-flash-exp:free`

## Need Help?

If none of these work, share:
1. Browser console output (debug messages)
2. localStorage contents
3. Network request payload
4. Any error messages

This will help identify the exact issue!
