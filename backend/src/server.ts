import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { LABELS } from '@arcmoq/shared';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = Number(process.env.PORT || 5173);
const frontendDist = path.join(__dirname, '../../frontend/dist');

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'arcmoq', labels: LABELS });
});

app.use('/api', apiRouter);
app.use(express.static(frontendDist));

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ArcMOQ app running on http://0.0.0.0:${PORT}`);
  console.log('Serving API + frontend from single port');
});
