#!/usr/bin/env tsx
import path from 'path';
import dotenv from 'dotenv';
import { getArcTestnetStatus, initializeArcTestnetDemo } from '../blockchain/service';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function main() {
  console.log('Arc Testnet status');
  const status = await getArcTestnetStatus();
  console.log(JSON.stringify(status, null, 2));
  if (!status.hasSigner) {
    console.log('\nSet DEPLOYER_PRIVATE_KEY in .env to run on-chain setup.');
    process.exit(1);
  }
  console.log('\nRunning on-chain demo setup...');
  const result = await initializeArcTestnetDemo();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
