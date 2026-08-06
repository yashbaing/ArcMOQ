#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.foundry/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v forge >/dev/null 2>&1; then
  echo "Install Foundry: https://book.getfoundry.sh/getting-started/installation"
  exit 1
fi

cd "$ROOT/contracts"
if [[ ! -d lib/forge-std ]]; then
  forge install foundry-rs/forge-std --no-commit || forge install foundry-rs/forge-std
fi
if [[ ! -d lib/openzeppelin-contracts ]]; then
  forge install OpenZeppelin/openzeppelin-contracts --no-commit || forge install OpenZeppelin/openzeppelin-contracts
fi

forge test -vv
cd "$ROOT/apps/web"
npm install
echo "Setup OK. Run: npm run dev (from apps/web or repo root)"
