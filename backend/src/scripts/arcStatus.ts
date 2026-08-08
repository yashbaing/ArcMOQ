#!/usr/bin/env tsx
import path from 'path';
import dotenv from 'dotenv';
import { getArcTestnetStatus } from '../blockchain/service';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function main() {
  const status = await getArcTestnetStatus();
  console.log(JSON.stringify(status, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
