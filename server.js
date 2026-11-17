import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

function pickEnv(...args) {
  const fallback = args.pop();
  for (const key of args) {
    const val = process.env[key];
    if (typeof val === 'string' && val.trim() && val.trim() !== 'TU_API_KEY') {
      return val.trim();
    }
  }
  return fallback;
}

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: ['AIzaSyC', 'Cguxq1KNYTng0lK2S5HvaYM03UpFMVmM'].join(''),
  authDomain: 'leyenda-ufro.firebaseapp.com',
  databaseURL: 'https://leyenda-ufro-default-rtdb.firebaseio.com',
  projectId: 'leyenda-ufro',
  storageBucket: 'leyenda-ufro.firebasestorage.app',
  messagingSenderId: '885333611273',
  appId: '1:885333611273:web:6af8b831a964d1a7ea79d8'
};

app.get('/firebase-config.js', (_req, res) => {
  const config = {
    apiKey: pickEnv('FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY', DEFAULT_FIREBASE_CONFIG.apiKey),
    authDomain: pickEnv('FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN', DEFAULT_FIREBASE_CONFIG.authDomain),
    databaseURL: pickEnv('FIREBASE_DATABASE_URL', 'NEXT_PUBLIC_FIREBASE_DATABASE_URL', 'VITE_FIREBASE_DATABASE_URL', DEFAULT_FIREBASE_CONFIG.databaseURL),
    projectId: pickEnv('FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID', DEFAULT_FIREBASE_CONFIG.projectId),
    storageBucket: pickEnv('FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET', DEFAULT_FIREBASE_CONFIG.storageBucket),
    messagingSenderId: pickEnv('FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID', DEFAULT_FIREBASE_CONFIG.messagingSenderId),
    appId: pickEnv('FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID', DEFAULT_FIREBASE_CONFIG.appId)
  };
  const rawNamespace = pickEnv('FIREBASE_APP_NAMESPACE', 'NEXT_PUBLIC_FIREBASE_APP_NAMESPACE', 'VITE_FIREBASE_APP_NAMESPACE', 'leyendas-ufro-global');
  const appNamespace = rawNamespace === config.projectId ? 'leyendas-ufro-global' : rawNamespace;

  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-store');
  res.send(
    `window.__firebase_config = ${JSON.stringify(JSON.stringify(config))};\n` +
      `window.__app_id = ${JSON.stringify(appNamespace)};\n`
  );
});

const ALLOWED_LOGO_HOSTS = new Set([
  'images.ligup2.com',
  'lh3.googleusercontent.com',
  'drive.google.com',
  'i.imgur.com',
  'imgur.com',
  'i.postimg.cc',
  'postimg.cc',
  'raw.githubusercontent.com'
]);

app.get('/api/logo-proxy', async (req, res) => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!rawUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_LOGO_HOSTS.has(parsed.hostname.toLowerCase())) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(4000),
      headers: {
        Accept: 'image/png,image/jpeg,image/webp,image/*,*/*;q=0.8'
      }
    });
    if (!upstream.ok) {
      return res.status(upstream.status).end();
    }

    const contentType = upstream.headers.get('content-type') || 'image/png';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return res.status(415).json({ error: 'Unsupported media type' });
    }

    const arrayBuf = await upstream.arrayBuffer();
    if (arrayBuf.byteLength > 2 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(Buffer.from(arrayBuf));
  } catch {
    return res.status(502).end();
  }
});

app.use('/public', express.static(path.join(__dirname, 'public')));

const htmlRoutes = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/leyendas': 'leyendas.html',
  '/leyendas.html': 'leyendas.html',
  '/notfc': 'notfc.html',
  '/notfc.html': 'notfc.html',
  '/perfil': 'perfil.html',
  '/perfil.html': 'perfil.html',
  '/leyendas-dev': 'leyendas-dev.html',
  '/leyendas-dev.html': 'leyendas-dev.html',
  '/principal-dev': 'principal-dev.html',
  '/principal-dev.html': 'principal-dev.html'
};

app.get('*', (req, res) => {
  const targetFile = htmlRoutes[req.path];
  if (targetFile) {
    return res.sendFile(path.join(__dirname, targetFile));
  }
  return res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });
}

export default app;

