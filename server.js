import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.get('/firebase-config.js', (_req, res) => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || 'TU_API_KEY',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  };

  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-store');
  res.send(
    `window.__firebase_config = ${JSON.stringify(JSON.stringify(config))};\n` +
      (process.env.FIREBASE_APP_NAMESPACE
        ? `window.__app_id = ${JSON.stringify(process.env.FIREBASE_APP_NAMESPACE)};\n`
        : '')
  );
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

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
