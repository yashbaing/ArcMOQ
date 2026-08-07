import path from 'path';
import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = createApp();
const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ArcMOQ backend running on http://0.0.0.0:${PORT}`);
});
