# ArcMOQ

**Small buyers. Real inventory. One autonomous global order.**

ArcMOQ helps UAE SMEs jointly purchase inventory from global suppliers. Multiple buyers combine demand into one large order, reach the supplier's MOQ, and unlock wholesale pricing. An AI procurement agent researches suppliers, negotiates terms, checks buyer mandates, and executes settlement within predefined limits on **Arc Testnet**.

## Demo Use Case

Spanish extra virgin olive oil from Jaén, purchased by 5 UAE businesses:

| Field | Value |
|-------|-------|
| Product | Extra Virgin Olive Oil (5L tins) |
| Combined demand | 860 tins |
| Original supplier MOQ | 1,000 tins |
| Negotiated MOQ | 860 tins @ €38.10/tin |
| Settlement | USDC pool → EURC to supplier |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React UI   │────▶│  Express API │────▶│  AI Agent Layer │
│  (5 screens)│     │  + viem      │     │  (structured)   │
└─────────────┘     └──────────────┘     └─────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │       Arc Testnet           │
              │  GroupOrder │ WarehouseReceipt│
              │  StableFXAdapter (demo)     │
              │  USDC (0x3600…) │ EURC      │
              └─────────────────────────────┘
```

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| `GroupOrder` | Pool buyer mandates, accept offers, execute USDC→EURC settlement |
| `WarehouseReceipt` | ERC-1155 digital warehouse receipts with restricted transfers |
| `StableFXAdapter` | Test adapter for USDC→EURC conversion (labeled demo mode) |

### AI Agent Components

1. **Supplier Research Agent** — compares sandbox supplier endpoints
2. **Demand Matching Agent** — aggregates compatible buyer mandates
3. **Negotiation Agent** — structured counteroffers (not free-form chat)
4. **Execution Policy Engine** — deterministic checks before any onchain tx

## Quick Start

### Prerequisites

- Node.js 18+
- Arc Testnet USDC + EURC from [Circle Faucet](https://faucet.circle.com)
- MetaMask or compatible wallet configured for Arc Testnet (Chain ID: `5042002`)

### Install

```bash
npm install
cp .env.example .env
```

### Compile Contracts

```bash
npm run compile
npm run test -w contracts
```

### Deploy to Arc Testnet

```bash
# Fund deployer wallet with testnet USDC from faucet
npm run deploy
```

Deployment addresses are saved to `backend/src/config/deployments.json`.

### Run the App

```bash
# Terminal 1 — backend
npm run dev -w backend

# Terminal 2 — frontend
npm run dev -w frontend
```

Open http://localhost:5173 and click **Run Full Demo** on the Orders page.

### CLI Demo

```bash
npm run demo
```

## Frontend Screens

1. **Active Group Orders** — demand, MOQ, savings, buyer mandates
2. **Create Buying Mandate** — AED budget, quantity, autonomous execution
3. **Agent Activity** — timeline of supplier comparison, negotiation, policy checks
4. **Settlement** — USDC pool, EURC payment, FX quote, ArcScan links
5. **Inventory Receipts** — ERC-1155 allocations, verification, redemption

## Demo Flow

1. Five UAE buyers submit mandates (860 tins total)
2. Agent compares 3 sandbox suppliers
3. Agent negotiates MOQ from 1,000 → 860 with Oliva Sur
4. Policy engine validates budgets, whitelist, FX tolerance
5. Settlement: USDC → EURC on Arc Testnet
6. Warehouse attestation verifies shipment
7. 860 receipt units minted to buyers
8. Restaurant A redeems 100 tins (burn receipt)

## What's Real vs Simulated

| Component | Status |
|-----------|--------|
| Arc Testnet contracts | **Live** |
| USDC buyer funding | **Live** (testnet) |
| EURC supplier payment | **Live** (testnet) |
| Warehouse receipt mint/burn | **Live** (testnet) |
| AED bank payment | Simulated PSP |
| Spanish suppliers | Sandbox endpoints |
| StableFX | Test Adapter Mode |
| Warehouse attestation | Demo Verifier |

## Arc Testnet Configuration

| Parameter | Value |
|-----------|-------|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.io` |
| Explorer | `https://testnet.arcscan.app` |
| USDC | `0x3600000000000000000000000000000000000000` |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/state` | Full app state |
| POST | `/api/agent/run-demo` | Run complete demo flow |
| POST | `/api/agent/aggregate` | Aggregate demand |
| POST | `/api/agent/compare` | Compare suppliers |
| POST | `/api/agent/negotiate` | Submit counteroffer |
| POST | `/api/agent/accept` | Accept supplier offer |
| POST | `/api/agent/policy-check` | Run policy validation |
| POST | `/api/agent/settle` | Execute settlement |
| POST | `/api/agent/verify-shipment` | Warehouse attestation |
| POST | `/api/agent/mint-receipts` | Mint ERC-1155 receipts |
| POST | `/api/agent/redeem` | Redeem physical goods |

## Hackathon Tracks

- **SME Trade Finance** — group purchasing, pooled settlement, transparent allocation
- **RWA Tokenization** — ERC-1155 warehouse receipts tied to verified shipments
- **Agentic Economy** — autonomous supplier research, negotiation, execution
- **Cross-Border Payments** — AED UX → USDC on Arc → EURC supplier settlement

## License

MIT
