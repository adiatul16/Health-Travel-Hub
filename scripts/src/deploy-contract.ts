/**
 * MediBridge Global — Contract Deployment Script
 *
 * Compiles CredentialRegistry.sol and deploys it to Polygon Amoy testnet.
 *
 * Prerequisites:
 *   1. Get free test POL from https://faucet.polygon.technology (select Amoy)
 *   2. Export your wallet private key (WITHOUT 0x prefix) as POLYGON_PRIVATE_KEY
 *
 * Usage:
 *   POLYGON_PRIVATE_KEY=<your_key> pnpm --filter @workspace/scripts run deploy-contract
 *
 * After deployment, add the printed address as CREDENTIAL_CONTRACT_ADDRESS in Replit Secrets.
 */

import { ethers } from "ethers";
import solc from "solc";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const AMOY_RPC = "https://rpc-amoy.polygon.technology";
const SOURCE_PATH = resolve(__dirname, "../../contracts/MediBridgeLedger.sol");
const LEDGER_PATH = join(__dirname, "../../lib/blockchain/ledger.json");

function compileContract() {
  const source = readFileSync(SOURCE_PATH, "utf8");
  const input = {
    language: "Solidity",
    sources: { "MediBridgeLedger.sol": { content: source } },
    settings: {
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
      optimizer: { enabled: true, runs: 200 },
    },
  };

  console.log("Compiling contract...");
  const output = JSON.parse(solc.compile(JSON.stringify(input))) as {
    errors?: Array<{ type: string; formattedMessage: string }>;
    contracts: Record<
      string,
      Record<string, { abi: unknown[]; evm: { bytecode: { object: string } } }>
    >;
  };

  const errors = (output.errors ?? []).filter((e) => e.type === "Error");
  if (errors.length > 0) {
    throw new Error(
      "Compilation errors:\n" + errors.map((e) => e.formattedMessage).join("\n")
    );
  }

  const contract =
    output.contracts["MediBridgeLedger.sol"]["MediBridgeLedger"];
  console.log("✓ Compiled successfully");
  return { abi: contract.abi, bytecode: "0x" + contract.evm.bytecode.object };
}

async function deploy() {
  const privateKey = process.env.POLYGON_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "Set POLYGON_PRIVATE_KEY environment variable before running this script."
    );
  }

  const { abi, bytecode } = compileContract();

  const provider = new ethers.JsonRpcProvider(AMOY_RPC);
  const network = await provider.getNetwork();
  console.log(`\nConnected to network: ${network.name} (chainId: ${network.chainId})`);

  const key = privateKey.startsWith("0x") ? privateKey : "0x" + privateKey;
  const wallet = new ethers.Wallet(key, provider);
  console.log(`Deployer address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} POL`);

  if (balance === 0n) {
    throw new Error(
      "Wallet has no POL. Get free test POL from https://faucet.polygon.technology (Amoy network)"
    );
  }

  console.log("\nDeploying CredentialRegistry...");
  const factory = new ethers.ContractFactory(abi as string[], bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const net = await provider.getNetwork();
  const output = {
    address,
    chainId: net.chainId.toString(),
    abi,
  };
  writeFileSync(LEDGER_PATH, JSON.stringify(output, null, 2));
  console.log("\n✅ Contract deployed!");
  console.log(`   Address: ${address}`);
  console.log(`   PolygonScan: https://amoy.polygonscan.com/address/${address}`);
  console.log(`   ledger.json updated: ${LEDGER_PATH}`);
}

deploy().catch((err) => {
  console.error("Deployment failed:", err.message);
  process.exit(1);
});
