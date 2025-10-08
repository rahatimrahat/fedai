#!/bin/bash

echo "=== Fedai App Testing ==="
echo ""

# Test 1: Frontend accessibility
echo "1. Testing Frontend (http://localhost:5173)..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "   ✓ Frontend is accessible"
else
    echo "   ✗ Frontend returned status: $FRONTEND_STATUS"
fi
echo ""

# Test 2: Backend accessibility
echo "2. Testing Backend (http://localhost:3001)..."
BACKEND_RESPONSE=$(curl -s http://localhost:3001)
if [[ "$BACKEND_RESPONSE" == *"Fedai Backend Proxy is running"* ]]; then
    echo "   ✓ Backend is running"
else
    echo "   ✗ Backend response: $BACKEND_RESPONSE"
fi
echo ""

# Test 3: Providers endpoint
echo "3. Testing /api/gemini-proxy/providers..."
PROVIDERS=$(curl -s http://localhost:3001/api/gemini-proxy/providers)
PROVIDER_COUNT=$(echo "$PROVIDERS" | jq '.providers | length' 2>/dev/null)
if [ "$PROVIDER_COUNT" -gt 0 ]; then
    echo "   ✓ Found $PROVIDER_COUNT providers"
    echo "$PROVIDERS" | jq -r '.providers[] | "     - \(.name) (\(.provider))"' 2>/dev/null
else
    echo "   ✗ No providers found"
fi
echo ""

# Test 4: Models endpoint (Gemini)
echo "4. Testing /api/gemini-proxy/models (Gemini)..."
MODELS=$(curl -s "http://localhost:3001/api/gemini-proxy/models?aiProvider=gemini")
MODEL_COUNT=$(echo "$MODELS" | jq '.models | length' 2>/dev/null)
if [ "$MODEL_COUNT" -gt 0 ]; then
    echo "   ✓ Found $MODEL_COUNT Gemini models"
    echo "$MODELS" | jq -r '.models[] | "     - \(.id): \(.name)"' 2>/dev/null
else
    echo "   ✗ No models found"
fi
echo ""

# Test 5: Container status
echo "5. Checking Docker containers..."
docker-compose -f docker-compose.dev.yml ps --format "table {{.Service}}\t{{.Status}}" 2>/dev/null | grep -v "^SERVICE"
echo ""

# Test 6: Check for errors in logs
echo "6. Checking for errors in logs..."
FRONTEND_ERRORS=$(docker logs fedai-frontend-dev-1 2>&1 | grep -i "error" | wc -l)
BACKEND_ERRORS=$(docker logs fedai-backend-dev-1 2>&1 | grep -i "error" | wc -l)

if [ "$FRONTEND_ERRORS" -eq 0 ]; then
    echo "   ✓ No frontend errors"
else
    echo "   ⚠ Found $FRONTEND_ERRORS frontend error(s)"
fi

if [ "$BACKEND_ERRORS" -eq 0 ]; then
    echo "   ✓ No backend errors"
else
    echo "   ⚠ Found $BACKEND_ERRORS backend error(s)"
fi
echo ""

echo "=== Summary ==="
echo "Frontend URL: http://localhost:5173"
echo "Backend URL:  http://localhost:3001"
echo ""
echo "To view logs:"
echo "  docker logs fedai-frontend-dev-1 -f"
echo "  docker logs fedai-backend-dev-1 -f"
echo ""
echo "To test in browser, open: http://localhost:5173"
