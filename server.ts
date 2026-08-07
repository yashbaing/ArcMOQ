import express from 'express';
import path from 'path';
import { createApp } from './backend/src/app';

const app = createApp();
const frontendDist = path.join(process.cwd(), 'frontend/dist');

app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next(err);
  });
});

export default app;
