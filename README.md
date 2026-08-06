# ArcMOQ

**Small buyers. Real inventory. One autonomous global order.**

ArcMOQ helps UAE SMEs jointly purchase inventory from global suppliers. An AI procurement agent researches suppliers, negotiates MOQ/price with structured offers, checks buyer mandates, and settles **USDC → EURC on Arc Testnet**. After warehouse attestation, each buyer receives an ERC-1155 digital warehouse receipt for its allocation.

## Hackathon tracks

- **Primary:** SME Trade Finance  
- **Secondary:** RWA Tokenization · Agentic Economy · Cross-Border Payments  

## Architecture

| Layer | What |
| --- | --- |
| `contracts/` | Foundry — `GroupOrder`, `WarehouseReceipt` (ERC-1155), `StableFXAdapter` (labeled test/adapter mode) |
| `apps/web` | Next.js demo — 5 screens + AI agent orchestrator + Arc RPC status |
| Settlement | UAE buyers see **AED** · pool **USDC** on Arc · supplier paid **EURC** |
| Labels | Simulated PSP · Sandbox suppliers · StableFX adapter · Demo warehouse verifier |

### Smart contracts (Arc Testnet targets)

- **USDC** `0x3600000000000000000000000000000000000000` (6 dec ERC-20)  
- **EURC** `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`  
- Chain ID `5042002` · RPC `https://rpc.testnet.arc.io` · Explorer [testnet.arcscan.app](https://testnet.arcscan.app)

### AI agent (four components)

1. **Supplier Research** — structured comparison  
2. **Demand Matching** — compatible mandate aggregation  
3. **Negotiation** — structured counteroffers (not free-form chat)  
4. **Execution Policy Engine** — deterministic gates before any transfer  

> AI is the execution layer, not the underlying asset verifier. Warehouse attestation is required before minting receipts.

## Demo use case

Spanish **extra virgin olive oil** (5L tins, Jaén) for five UAE buyers — combined demand **860 tins**. Agent renegotiates supplier MOQ from **1,000 → 860** for immediate EURC + monthly recurring intent.

## Quick start

```bash
# 1. Contracts
curl -L https://foundry.paradigm.xyz | bash && foundryup
cd contracts && forge install && forge test -vv

# 2. Web app
cd ../apps/web && npm install && npm run dev
# open http://localhost:3000 → "Run full demo"
```

### Deploy to Arc Testnet

1. Fund a wallet with Arc Testnet USDC (+ EURC to seed the adapter) from [Circle Faucet](https://faucet.circle.com).  
2. Copy `.env.example` → `.env` / `apps/web/.env.local` and set `PRIVATE_KEY`.  
3. Run:

```bash
chmod +x scripts/*.sh
export PRIVATE_KEY=0x...
./scripts/deploy-arc.sh
```

4. Paste deployed addresses into `NEXT_PUBLIC_GROUP_ORDER`, `NEXT_PUBLIC_WAREHOUSE_RECEIPT`, `NEXT_PUBLIC_STABLEFX_ADAPTER`.

### Local Anvil (offline)

```bash
./scripts/deploy-local.sh
```

## MVP screens

1. **Orders** — active group order, demand vs MOQ, savings  
2. **Mandate** — AED budget, deadline, autonomous permission  
3. **Agent** — timeline, supplier compare, MOQ renegotiation  
4. **Settlement** — policy checks, USDC pool, EURC pay, Arc tx link  
5. **Receipts** — attestation, ERC-1155 allocation, redeem/burn  

## What is real vs simulated

| Real / on Arc Testnet | Simulated (clearly labeled) |
| --- | --- |
| GroupOrder + WarehouseReceipt contracts | AED local PSP collection |
| USDC pool / EURC settlement path | Spanish supplier APIs (sandbox) |
| Policy validation & agent structured negotiation | Physical warehouse / customs |
| Receipt mint + redeem design | Production StableFX liquidity (adapter mode) |

## Pitch

> ArcMOQ helps UAE SMEs buy global inventory together. An AI agent negotiates the order and pays the Spanish supplier in EURC, while each buyer receives an onchain claim for its share of the real goods.

## License

MIT
