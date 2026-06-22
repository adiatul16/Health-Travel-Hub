/**
 * Seed MediBridgeLedger on Polygon Amoy with demo data.
 * Uses the deployer wallet (POLYGON_PRIVATE_KEY) to submit transactions.
 */

import { ethers } from "ethers";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const AMOY_RPC = "https://rpc-amoy.polygon.technology";
const LEDGER_PATH = join(__dirname, "../../lib/blockchain/ledger.json");
const ledgerInfo = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));

const LEDGER_ADDRESS = ledgerInfo.address;
const LEDGER_ABI = ledgerInfo.abi;
const LEDGER_CHAIN_ID = ledgerInfo.chainId;

function getProvider() {
  return new ethers.JsonRpcProvider(AMOY_RPC);
}

function getWallet() {
  const key = process.env.POLYGON_PRIVATE_KEY;
  if (!key) throw new Error("POLYGON_PRIVATE_KEY secret not set");
  const fullKey = key.startsWith("0x") ? key : "0x" + key;
  return new ethers.Wallet(fullKey, getProvider());
}

async function main() {
  const wallet = getWallet();
  const provider = getProvider();
  const contract = new ethers.Contract(LEDGER_ADDRESS, LEDGER_ABI, wallet);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} POL`);
  console.log(`Contract: ${LEDGER_ADDRESS}`);
  console.log("---");

  if (balance === 0n) {
    throw new Error("Wallet has no POL. Get test POL from https://faucet.polygon.technology");
  }

  // Helper addresses (derived deterministically for demo)
  const clinic1 = ethers.computeAddress(ethers.keccak256(ethers.toUtf8Bytes("demo-clinic-1")));
  const clinic2 = ethers.computeAddress(ethers.keccak256(ethers.toUtf8Bytes("demo-clinic-2")));
  const doctor1 = ethers.computeAddress(ethers.keccak256(ethers.toUtf8Bytes("demo-doctor-1")));
  const doctor2 = ethers.computeAddress(ethers.keccak256(ethers.toUtf8Bytes("demo-doctor-2")));
  const patient1 = ethers.computeAddress(ethers.keccak256(ethers.toUtf8Bytes("demo-patient-1")));
  const patient2 = ethers.computeAddress(ethers.keccak256(ethers.toUtf8Bytes("demo-patient-2")));

  const expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;

  // 1. Verify clinics
  const tx1 = await contract.verifyClinic(clinic1, "Istanbul Aesthetic Center", "JCI Accreditation", expiry);
  await tx1.wait();
  console.log("✓ Clinic 1 verified:", clinic1);

  const tx2 = await contract.verifyClinic(clinic2, "Antalya Dental Excellence", "ISO 9001", expiry);
  await tx2.wait();
  console.log("✓ Clinic 2 verified:", clinic2);

  // 2. Verify doctors
  const tx3 = await contract.verifyDoctor(doctor1, clinic1, "TR-MED-45231", expiry);
  await tx3.wait();
  console.log("✓ Doctor 1 verified:", doctor1);

  const tx4 = await contract.verifyDoctor(doctor2, clinic2, "TR-DEN-88102", expiry);
  await tx4.wait();
  console.log("✓ Doctor 2 verified:", doctor2);

  // 3. Add records (using the deployer wallet as the caller — the contract records msg.sender as patient)
  const hash1 = ethers.keccak256(ethers.toUtf8Bytes("pre-op-scan-james-wilson"));
  const tx5 = await contract.addRecord(hash1, "MRI_Scan_2024_07.pdf", "pre-op");
  await tx5.wait();
  console.log("✓ Record 1 added (pre-op)");

  const hash2 = ethers.keccak256(ethers.toUtf8Bytes("post-op-scan-james-wilson"));
  const tx6 = await contract.addRecord(hash2, "FollowUp_2024_08.pdf", "post-op");
  await tx6.wait();
  console.log("✓ Record 2 added (post-op)");

  const hash3 = ethers.keccak256(ethers.toUtf8Bytes("pre-op-scan-sarah-chen"));
  const tx7 = await contract.addRecord(hash3, "XRay_Scan_2024_06.pdf", "pre-op");
  await tx7.wait();
  console.log("✓ Record 3 added (pre-op)");

  // 4. Add reviews
  const tx8 = await contract.addReview(clinic1, 5, "Excellent care and professional staff. Highly recommend!");
  await tx8.wait();
  console.log("✓ Review 1 added");

  const tx9 = await contract.addReview(clinic2, 4, "Great dental work, very clean facility.");
  await tx9.wait();
  console.log("✓ Review 2 added");

  // 5. Summary
  const recordCount = await contract.getRecordCount();
  const reviewCount1 = await contract.getReviewCount(clinic1);
  const reviewCount2 = await contract.getReviewCount(clinic2);

  console.log("\n🎉 Seeding complete!");
  console.log(`  Records: ${recordCount}`);
  console.log(`  Reviews clinic1: ${reviewCount1}`);
  console.log(`  Reviews clinic2: ${reviewCount2}`);
  console.log(`  View contract: https://amoy.polygonscan.com/address/${LEDGER_ADDRESS}`);
}

main().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
