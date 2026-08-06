# ArcMOQ Contracts

Foundry project targeting **Arc Testnet** (chain ID `5042002`).

## Contracts

- `GroupOrder.sol` — buyer mandates, USDC pool, offer accept, EURC settlement
- `WarehouseReceipt.sol` — ERC-1155 restricted receipts, attest → mint → redeem/burn
- `StableFXAdapter.sol` — labeled **StableFX: Test or Adapter Mode** (USDC→EURC only)
- `mocks/MockERC20.sol` — local testing

## Test

```bash
forge test -vv
```

## Deploy Arc Testnet

```bash
export PRIVATE_KEY=0x...
export AGENT_ADDRESS=0x...   # optional, defaults to deployer
forge script script/DeployArcMOQ.s.sol:DeployArcMOQ \
  --rpc-url https://rpc.testnet.arc.io --broadcast -vvv
```

Seed the adapter with EURC after deploy (`StableFXAdapter.seedEURC`) so settlement swaps can succeed.
