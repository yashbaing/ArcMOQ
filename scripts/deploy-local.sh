#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.foundry/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

# Start anvil in background if not running
if ! curl -s -X POST -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://127.0.0.1:8545 >/dev/null 2>&1; then
  echo "Starting anvil..."
  anvil --chain-id 31337 >/tmp/anvil-arcmoq.log 2>&1 &
  echo $! >/tmp/anvil-arcmoq.pid
  sleep 1
fi

export PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  -vvv

echo "Local deploy complete. Anvil PID: $(cat /tmp/anvil-arcmoq.pid 2>/dev/null || echo n/a)"
