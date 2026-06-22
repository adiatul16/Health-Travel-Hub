# MediBridge Blockchain Layer

A Solidity-based trust layer on the **Polygon Amoy** testnet for MediBridge Global. It provides on-chain verification of clinics and doctors, tamper-evident medical record hashing, patient-controlled consent, and verified reviews.

---

## What it does

| Feature | On-chain | What gets stored |
|---------|----------|-----------------|
| **Clinic verification** | Address + accreditation + expiry | Name, accreditation string, expiry timestamp |
| **Doctor verification** | Address + license + clinic | License number, expiry, linked clinic |
| **Record hashes** | SHA-256 of record data | Only the hash; files stay off-chain |
| **Patient consent** | Grant/revoke per record & doctor | Consent mapping (no raw data) |
| **Reviews** | Only from on-chain patients | Rating (1-5) + comment |

---

## Prerequisites

1. **MetaMask** browser extension installed
2. **Polygon Amoy** testnet added to MetaMask (or let the app add it)
3. **MATIC** test tokens from the [Amoy faucet](https://faucet.polygon.technology)

---

## Setup

### 1. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```
DEPLOYER_PRIVATE_KEY=0x...
ALCHEMY_API_KEY=...
OWNER_ADDRESS=0x...
```

### 2. Deploy the contract

```bash
# From workspace root
pnpm run deploy-contract
# Or directly:
pnpm --filter @workspace/scripts run deploy-contract
```

The deploy script will write the contract address and ABI to:

```
lib/blockchain/ledger.json
```

### 3. Seed demo data

```bash
pnpm --filter @workspace/scripts run seed-contract
```

This runs `seed.ts` and creates sample verifications, records, and reviews.

### 4. Restart the dev server

The frontend reads the deployed address from `ledger.json` at build time.

```bash
# Restart the web workflow so Vite picks up the new ledger.json
```

---

## Using the blockchain features

### Patient Dashboard
- **Connect Wallet** → MetaMask connects to Polygon Amoy
- **Add Record Hash** → prompts for a reference, hashes it, anchors on-chain
- **Leave Review** → prompts for clinic address, rating, and comment
- **Blockchain Ledger** → opens the public /verify page

### Clinic Dashboard
- **Connect Wallet** → clinic operators link their wallet
- **Register Doctor** → prompts for doctor address and license; verifies on-chain
- **Add Record Hash** → anchors a record hash linked to the clinic
- **Check Status** → reads whether the clinic is verified and its review count
- **View Ledger** → opens the public /verify page

### Admin Dashboard
- **Connect Wallet** → admin links their wallet (must be contract owner)
- **Verify Clinic** → prompts for clinic address, name, and accreditation; writes on-chain
- **View Ledger** → opens the public /verify page

### Public /verify Page
- Lists all on-chain events (verifications, records, consent, reviews)
- Filter by event type
- Every card links to PolygonScan for transaction details
- No wallet required — completely free, read-only

---

## Contract

- **Location**: `contracts/MediBridgeLedger.sol`
- **Standard**: OpenZeppelin Ownable
- **Network**: Polygon Amoy (Chain ID 80002)
- **RPC**: `https://rpc-amoy.polygon.technology`
- **Explorer**: `https://amoy.polygonscan.com`

---

## Architecture

```
Patient/Clinic/Admin UI
     ↓
ethers.js v6 (BrowserProvider + MetaMask)
     ↓
MediBridgeLedger.sol (Polygon Amoy)
     ↓
Amoy RPC node ← PolygonScan read-only
```

No backend blockchain integration. All reads are free RPC calls. All writes go through MetaMask.

---

## Security

- **No raw health data** ever touches the blockchain. Only SHA-256 hashes are stored.
- **Consent is patient-controlled** — only the patient wallet can grant/revoke.
- **Reviews are verified** — only wallets with prior on-chain interactions can submit.
- **Owner-only** verifications — `verifyClinic` and `verifyDoctor` are restricted to the contract owner.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "MetaMask not installed" | Install the extension and refresh the page |
| "Wrong network" | The app will auto-prompt to switch to Polygon Amoy |
| "No funds" | Request MATIC from the [Amoy faucet](https://faucet.polygon.technology) |
| "Contract not deployed" | Run `pnpm run deploy-contract` and check `ledger.json` has a non-empty address |
| "TX reverted" | Check the clinic address format (0x...) and verify the admin wallet is the contract owner |
