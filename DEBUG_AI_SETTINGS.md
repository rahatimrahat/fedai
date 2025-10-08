# Debug AI Settings Issue

## Problem
- Test Connection works with API key
- Analysis fails with "API key not valid"
- Settings appear to be saved but not used during analysis

## To Debug in Browser Console

Open http://localhost:5173 and run these commands in the browser console:

### 1. Check what's in localStorage:
```javascript
console.log('Stored settings:', localStorage.getItem('fedai_ai_settings'));
const settings = JSON.parse(localStorage.getItem('fedai_ai_settings'));
console.log('Parsed settings:', settings);
console.log('API Key length:', settings?.apiKey?.length || 0);
console.log('Provider:', settings?.provider);
```

### 2. Check what's being sent to backend:
Open Network tab → Start analysis → Look for `/api/gemini-proxy` POST request → Check Request Payload

Should see:
```json
{
  "image": {...},
  "language": {...},
  "aiProvider": "gemini",
  "aiApiKey": "AIza...your-key...",
  "aiModel": "gemini-2.0-flash-exp"
}
```

### 3. Force refresh the settings:
```javascript
// Clear and reload
localStorage.removeItem('fedai_ai_settings');
location.reload();

// Then reconfigure:
// 1. Click robot icon
// 2. Select Gemini
// 3. Enter API key
// 4. Click "Save"
```

## Quick Fix

If settings are not persisting, manually set them:

```javascript
localStorage.setItem('fedai_ai_settings', JSON.stringify({
  provider: 'gemini',
  apiKey: 'YOUR_ACTUAL_API_KEY_HERE',
  model: 'gemini-2.0-flash-exp'
}));
location.reload();
```

Replace `YOUR_ACTUAL_API_KEY_HERE` with your actual Google Gemini API key.

## Expected Behavior

1. **Save Settings**: Click robot icon → Configure → Save
2. **Check localStorage**: Should contain your settings
3. **Start Analysis**: aiApiKey should be included in request
4. **Backend receives**: API key in request body
5. **Analysis succeeds**: Gemini API called with valid key

## If Still Failing

Try using OpenRouter instead (has free models):

1. Get API key: https://openrouter.ai/keys
2. Click robot icon
3. Select "OpenRouter"
4. Paste API key
5. Wait for models to load
6. Select: `google/gemini-2.0-flash-exp:free`
7. Test & Save
8. Try analysis

This uses a different provider and might bypass the issue.
