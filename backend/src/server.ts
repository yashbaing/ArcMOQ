import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = createApp();
const PORT = Number(process.env.PORT || 5173);
const frontendDist = path.join(__dirname, '../../frontend/dist');

app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ArcMOQ app running on http://0.0.0.0:${PORT}`);
  console.log('Serving API + frontend from single port');
});
