import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // TODO: Use an environment variable for the proxy URL in a production setup
    const proxyRes = await fetch('http://localhost:3001/api/ip-location', {
      method: 'GET',
      headers: {
        // Forward necessary headers if any. For now, let's assume User-Agent is handled by the proxy or not strictly needed.
        // 'User-Agent': req.headers['user-agent'] || 'Next.js API Route',
      },
    });

    if (!proxyRes.ok) {
      // If the proxy server responded with an error, forward that status and message
      const errorData = await proxyRes.json().catch(() => ({ error: 'Proxy server returned an error' }));
      res.status(proxyRes.status).json(errorData);
      return;
    }

    const data = await proxyRes.json();
    // Assuming the proxy returns data in the expected format
    // If the proxy already formats it to match IpLocationFetchResult, this is fine.
    // Otherwise, mapping might be needed here.
    res.status(200).json(data);
  } catch (error) {
    console.error('Error calling IP location proxy:', error);
    res.status(500).json({ error: 'Failed to fetch IP location via proxy' });
  }
}
