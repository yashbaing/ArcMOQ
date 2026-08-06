import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { LABELS } from '@arcmoq/shared';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'arcmoq-backend', labels: LABELS });
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`ArcMOQ backend running on http://localhost:${PORT}`);
  console.log('Labels:', LABELS);
});
