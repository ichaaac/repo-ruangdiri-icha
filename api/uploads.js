/**
 * Vercel serverless proxy for /uploads/* requests.
 * Forwards to ngrok BE with ngrok-skip-browser-warning header
 * so images load without the interstitial page.
 */
export default async function handler(req, res) {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ error: 'Missing path' });
  }

  const target = `https://deprived-sara-illegitimately.ngrok-free.dev/uploads/${filePath}`;

  try {
    const response = await fetch(target, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      return res.status(response.status).end();
    }

    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = Buffer.from(await response.arrayBuffer());
    return res.status(200).send(buffer);
  } catch {
    return res.status(502).json({ error: 'Failed to fetch image' });
  }
}
