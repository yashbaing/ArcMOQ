#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.foundry/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

RPC="${ARC_RPC_URL:-https://rpc.testnet.arc.io}"

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "ERROR: Set PRIVATE_KEY (funded Arc Testnet wallet with USDC from https://faucet.circle.com)."
  exit 1
fi

echo "Deploying ArcMOQ to Arc Testnet ($RPC)..."
forge script script/DeployArcMOQ.s.sol:DeployArcMOQ \
  --rpc-url "$RPC" \
  --broadcast \
  -vvv

mkdir -p "$ROOT/deployments"
echo "Copy addresses from forge output into apps/web/.env.local and deployments/arc-testnet.json"
