// fedai-backend-proxy/server.js

const app = require('./src/app');

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Fedai Backend Proxy listening on port ${port}`);
  console.log(`Frontend should call this proxy endpoints like http://localhost:${port}/api/gemini-proxy, /api/weather, etc.`);
});