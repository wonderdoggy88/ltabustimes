import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import serverless handlers from project root /api folder
import busArrivalHandler from './api/busarrival';
import healthHandler from './api/health';
import busStopsHandler from './api/bus-stops';
import busRoutesHandler from './api/bus-routes';
import busServicesHandler from './api/bus-services';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API Routes mounted to serverless handlers in /api folder
app.get('/api/health', (req: Request, res: Response) => healthHandler(req, res));

// Support both /api/busarrival and aliases (/api/bus-arrival, /api/lta/bus-arrival)
app.get('/api/busarrival', (req: Request, res: Response) => busArrivalHandler(req, res));
app.get('/api/bus-arrival', (req: Request, res: Response) => busArrivalHandler(req, res));
app.get('/api/lta/bus-arrival', (req: Request, res: Response) => busArrivalHandler(req, res));

app.get('/api/bus-stops', (req: Request, res: Response) => busStopsHandler(req, res));
app.get('/api/lta/bus-stops', (req: Request, res: Response) => busStopsHandler(req, res));

app.get('/api/bus-routes', (req: Request, res: Response) => busRoutesHandler(req, res));
app.get('/api/lta/bus-routes', (req: Request, res: Response) => busRoutesHandler(req, res));

app.get('/api/bus-services', (req: Request, res: Response) => busServicesHandler(req, res));
app.get('/api/lta/bus-services', (req: Request, res: Response) => busServicesHandler(req, res));

// Vite Middleware for development & static build serving for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Der Shings Bus Arrivals] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
