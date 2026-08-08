import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api';
import { LABELS } from '@arcmoq/shared';

export function createApp() {
  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'arcmoq', labels: LABELS });
  });

  app.use('/api', apiRouter);
  app.use(apiRouter);

  return app;
}
