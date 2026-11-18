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

const DEFAULT_NOTFC_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYhD72gP7j64pCvF6L6el4Q5S0fsuXhHraTPoNsTnKG7EL1W7Vp4kWY6QLRGthOpbu4SXMKZvyu-gr/pubhtml';

function extractPubHtmlBaseUrl(sheetUrl) {
  const idx = sheetUrl.indexOf('/pubhtml');
  if (idx !== -1) return sheetUrl.slice(0, idx);
  return sheetUrl.replace(/\/+$/, '');
}

function parsePubHtmlTabs(html) {
  const tabs = [];
  const seenGids = new Set();
  const pushRe = /items\.push\(\{\s*name:\s*(['"])(.*?)\1[\s\S]*?gid:\s*(['"])(\d+)\3/g;
  let m;
  while ((m = pushRe.exec(html)) !== null) {
    const rawName = m[2].replace(/\\u0026/g, '&').replace(/\\"/g, '"').replace(/\\'/g, "'").trim();
    const gid = m[4];
    if (rawName && gid && !seenGids.has(gid)) {
      seenGids.add(gid);
      tabs.push({ name: rawName, gid });
    }
  }
  const liRe = /id="sheet-button-(\d+)"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g;
  while ((m = liRe.exec(html)) !== null) {
    const gid = m[1];
    const name = m[2].trim();
    if (name && gid && !seenGids.has(gid)) {
      seenGids.add(gid);
      tabs.push({ name, gid });
    }
  }
  return tabs;
}

app.get('/api/notfc-sheets', async (req, res) => {
  const rawUrl = typeof req.query.url === 'string' && req.query.url.trim()
    ? req.query.url.trim()
    : DEFAULT_NOTFC_SHEET_URL;

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ ok: false, source: 'fallback_seed', error: 'URL de Google Sheets inválida.' });
  }

  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'docs.google.com' || !parsed.pathname.includes('/spreadsheets/')) {
    return res.status(403).json({ ok: false, source: 'fallback_seed', error: 'Solo se permiten enlaces de docs.google.com/spreadsheets.' });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(7000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotIntercarreras/1.0)',
        Accept: 'text/html,application/xhtml+xml,text/csv,*/*'
      }
    });

    if (!upstream.ok) {
      return res.json({
        ok: false,
        source: 'fallback_seed',
        upstreamStatus: upstream.status,
        sheetUrl: parsed.toString(),
        error: `Google Sheets respondió HTTP ${upstream.status}. Verifica que el documento esté publicado en la web (Todo el documento).`
      });
    }

    const html = await upstream.text();
    const allTabs = parsePubHtmlTabs(html);
    if (allTabs.length === 0) {
      return res.json({
        ok: false,
        source: 'fallback_seed',
        upstreamStatus: 200,
        sheetUrl: parsed.toString(),
        error: 'No se encontraron pestañas F7-EQUIPOS, F7-JUGADORES o CARRERAS-UFRO en el enlace.'
      });
    }

    const base = extractPubHtmlBaseUrl(parsed.toString());
    const targetTabs = allTabs.filter((t) => {
      const upper = t.name.toUpperCase();
      return upper.startsWith('F7-EQUIPOS') || upper.startsWith('F7-JUGADORES') || upper.startsWith('CARRERAS-UFRO');
    });

    const fetched = await Promise.all(targetTabs.map(async (tab) => {
      const csvUrl = `${base}/pub?gid=${encodeURIComponent(tab.gid)}&single=true&output=csv`;
      const csvRes = await fetch(csvUrl, { signal: AbortSignal.timeout(6000) });
      if (!csvRes.ok) return null;
      const csv = await csvRes.text();
      return { name: tab.name, gid: tab.gid, csv };
    }));

    const equiposTabs = [];
    const jugadoresTabs = [];
    const carrerasTabs = [];
    for (const item of fetched) {
      if (!item) continue;
      const upper = item.name.toUpperCase();
      if (upper.startsWith('F7-EQUIPOS')) equiposTabs.push(item);
      else if (upper.startsWith('F7-JUGADORES')) jugadoresTabs.push(item);
      else if (upper.startsWith('CARRERAS-UFRO')) carrerasTabs.push(item);
    }

    if (equiposTabs.length === 0) {
      return res.json({
        ok: false,
        source: 'fallback_seed',
        upstreamStatus: 200,
        sheetUrl: parsed.toString(),
        error: 'No se hallaron hojas cuyo nombre comience con F7-EQUIPOS.'
      });
    }

    res.setHeader('Cache-Control', 'public, max-age=120');
    return res.json({
      ok: true,
      source: 'google_sheets_live',
      sheetUrl: parsed.toString(),
      equiposTabs,
      jugadoresTabs,
      carrerasTabs
    });
  } catch (err) {
    return res.json({
      ok: false,
      source: 'fallback_seed',
      sheetUrl: parsed.toString(),
      error: err?.message || 'Error conectando con Google Sheets'
    });
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

