import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './server/routes.js';
import { getDb } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(cors());
  app.use(express.json());

  // Initialize DB and ensure tables + seeds are ready
  try {
    await getDb();
    console.log('[WorkSpace FFE] Database initialized successfully.');
  } catch (err) {
    console.error('[WorkSpace FFE] Database initialization error:', err);
  }

  // Mount API routes
  app.use('/api', apiRouter);

  if (!isProduction) {
    // Mount Vite dev middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WorkSpace FFE] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[WorkSpace FFE] Fatal server startup error:', err);
  process.exit(1);
});
