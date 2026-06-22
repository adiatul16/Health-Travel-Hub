import { ethers } from "ethers";
import crypto from "crypto";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const AMOY_RPC = "https://rpc-amoy.polygon.technology";

/* ─── MediBridgeLedger contract (new — deployed at 0x86...) ─── */
const ledgerPath = join(__dirname, "../../../lib/blockchain/ledger.json");
const ledgerInfo = JSON.parse(readFileSync(ledgerPath, "utf8"));
const LEDGER_ADDRESS = process.env.CREDENTIAL_CONTRACT_ADDRESS || ledgerInfo.address;
const LEDGER_ABI = ledgerInfo.abi;

/* ─── Legacy CredentialRegistry contract (separate — optional) ─── */
const LEGACY_CONTRACT_ADDRESS = process.env.CREDENTIAL_CONTRACT_ADDRESS;
const LEGACY_ABI = [
  "function anchor(string entityId, bytes32 documentHash, string issuer, string credentialType) external",
  "function getRecords(string entityId) view returns (tuple(bytes32 documentHash, string issuer, uint256 timestamp, string credentialType)[])",
  "function verify(string entityId, bytes32 documentHash) view returns (bool found, uint256 timestamp)",
  "function owner() view returns (address)",
  "event CredentialAnchored(string indexed entityId, bytes32 documentHash, string issuer, uint256 timestamp)",
];

export function hashDocument(content: string): string {
  return "0x" + crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export function isBlockchainConfigured(): boolean {
  return !!(process.env.POLYGON_PRIVATE_KEY && LEGACY_CONTRACT_ADDRESS);
}

export function isLedgerConfigured(): boolean {
  return !!(process.env.POLYGON_PRIVATE_KEY && LEDGER_ADDRESS);
}

function getProvider() {
  return new ethers.JsonRpcProvider(AMOY_RPC);
}

function getWallet() {
  const key = process.env.POLYGON_PRIVATE_KEY;
  if (!key) throw new Error("POLYGON_PRIVATE_KEY secret not set");
  return new ethers.Wallet(key, getProvider());
}

/* Ledger (new contract) */
function getLedgerContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  if (!LEDGER_ADDRESS) throw new Error("LEDGER_ADDRESS not set");
  return new ethers.Contract(LEDGER_ADDRESS, LEDGER_ABI, signerOrProvider ?? getProvider());
}

/* Legacy (credential registry) */
function getLegacyContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  if (!LEGACY_CONTRACT_ADDRESS) throw new Error("CREDENTIAL_CONTRACT_ADDRESS not set");
  return new ethers.Contract(LEGACY_CONTRACT_ADDRESS, LEGACY_ABI, signerOrProvider ?? getProvider());
}

/* ─── Write operations (backend wallet) ─── */
export async function addRecord(
  patientAddress: string,
  dataHash: string,
  ref: string,
  phase: string
): Promise<{ txHash: string }> {
  const wallet = getWallet();
  const contract = getLedgerContract(wallet);
  const tx = await (contract.addRecord as any)(dataHash, ref, phase);
  const receipt = await tx.wait(1);
  if (!receipt) throw new Error("Transaction not confirmed");
  return { txHash: receipt.hash };
}

export async function verifyClinic(
  clinicAddress: string,
  name: string,
  accreditation: string,
  expiryDays: number
): Promise<{ txHash: string }> {
  const wallet = getWallet();
  const contract = getLedgerContract(wallet);
  const expiry = Math.floor(Date.now() / 1000) + expiryDays * 24 * 3600;
  const tx = await (contract.verifyClinic as any)(clinicAddress, name, accreditation, expiry);
  const receipt = await tx.wait(1);
  if (!receipt) throw new Error("Transaction not confirmed");
  return { txHash: receipt.hash };
}

export async function verifyDoctor(
  doctorAddress: string,
  clinicAddress: string,
  license: string,
  expiryDays: number
): Promise<{ txHash: string }> {
  const wallet = getWallet();
  const contract = getLedgerContract(wallet);
  const expiry = Math.floor(Date.now() / 1000) + expiryDays * 24 * 3600;
  const tx = await (contract.verifyDoctor as any)(doctorAddress, clinicAddress, license, expiry);
  const receipt = await tx.wait(1);
  if (!receipt) throw new Error("Transaction not confirmed");
  return { txHash: receipt.hash };
}

export async function addReview(
  patientAddress: string,
  clinicAddress: string,
  rating: number,
  comment: string
): Promise<{ txHash: string }> {
  const wallet = getWallet();
  const contract = getLedgerContract(wallet);
  const tx = await (contract.addReview as any)(clinicAddress, rating, comment);
  const receipt = await tx.wait(1);
  if (!receipt) throw new Error("Transaction not confirmed");
  return { txHash: receipt.hash };
}

/* ─── Legacy CredentialRegistry functions (old contract) ─── */
export async function anchorCredential(
  entityId: string,
  documentHash: string,
  issuer: string,
  credentialType: string
): Promise<{ txHash: string; timestamp: Date }> {
  const wallet = getWallet();
  const contract = getLegacyContract(wallet);
  const anchorFn = contract["anchor"] as (
    a: string,
    b: string,
    c: string,
    d: string
  ) => Promise<ethers.TransactionResponse>;
  const tx = await anchorFn(entityId, documentHash, issuer, credentialType);
  const receipt = await tx.wait(1);
  if (!receipt) throw new Error("Transaction receipt not received");
  return { txHash: receipt.hash, timestamp: new Date() };
}

export interface OnChainRecord {
  documentHash: string;
  issuer: string;
  timestamp: number;
  credentialType: string;
}

export async function getOnChainRecords(entityId: string): Promise<OnChainRecord[]> {
  const contract = getLegacyContract();
  const getRecordsFn = contract["getRecords"] as (e: string) => Promise<
    Array<{ documentHash: string; issuer: string; timestamp: bigint; credentialType: string }>
  >;
  const recs = await getRecordsFn(entityId);
  return recs.map((r) => ({
    documentHash: r.documentHash,
    issuer: r.issuer,
    timestamp: Number(r.timestamp),
    credentialType: r.credentialType,
  }));
}

export async function verifyOnChain(
  entityId: string,
  documentHash: string
): Promise<{ found: boolean; timestamp: number }> {
  const contract = getLegacyContract();
  const verifyFn = contract["verify"] as (
    e: string,
    h: string
  ) => Promise<[boolean, bigint]>;
  const [found, ts] = await verifyFn(entityId, documentHash);
  return { found, timestamp: Number(ts) };
}

/* ─── Read operations (free, no wallet) ─── */
export async function isClinicVerified(address: string): Promise<boolean> {
  const contract = getLedgerContract();
  return (contract.isClinicVerified as any)(address);
}

export async function isDoctorVerified(address: string): Promise<boolean> {
  const contract = getLedgerContract();
  return (contract.isDoctorVerified as any)(address);
}

export async function getClinicInfo(address: string): Promise<{ name: string; accreditation: string; expiry: bigint; verified: boolean }> {
  const contract = getLedgerContract();
  const result = await (contract.clinics as any)(address);
  return {
    name: result[0],
    accreditation: result[1],
    expiry: result[2],
    verified: result[3],
  };
}

export async function getDoctorInfo(address: string): Promise<{ clinic: string; license: string; expiry: bigint; verified: boolean }> {
  const contract = getLedgerContract();
  const result = await (contract.doctors as any)(address);
  return {
    clinic: result[0],
    license: result[1],
    expiry: result[2],
    verified: result[3],
  };
}

export async function hasConsent(patient: string, doctor: string, recordHash: string): Promise<boolean> {
  const contract = getLedgerContract();
  return (contract.hasConsent as any)(patient, doctor, recordHash);
}

export async function getReviewCount(clinicAddress: string): Promise<number> {
  const contract = getLedgerContract();
  const count = await (contract.getReviewCount as any)(clinicAddress);
  return Number(count);
}

export async function getRecordCount(): Promise<number> {
  const contract = getLedgerContract();
  const count = await (contract.getRecordCount as any)();
  return Number(count);
}

export async function hasOnChainInteraction(address: string): Promise<boolean> {
  const contract = getLedgerContract();
  return (contract.hasOnChainInteraction as any)(address);
}

/* ─── Events (read-only, limited block range) ─── */
export async function getAllEvents() {
  const provider = getProvider();
  const contract = new ethers.Contract(LEDGER_ADDRESS, LEDGER_ABI, provider);

  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latestBlock - 50);

  const clinicFilter = contract.filters.ClinicVerified();
  const doctorFilter = contract.filters.DoctorVerified();
  const recordFilter = contract.filters.RecordAdded();
  const consentGrantFilter = contract.filters.ConsentGranted();
  const consentRevokeFilter = contract.filters.ConsentRevoked();
  const reviewFilter = contract.filters.ReviewAdded();

  const [clinicEvents, doctorEvents, recordEvents, consentGrantEvents, consentRevokeEvents, reviewEvents] =
    await Promise.all([
      contract.queryFilter(clinicFilter, fromBlock, "latest"),
      contract.queryFilter(doctorFilter, fromBlock, "latest"),
      contract.queryFilter(recordFilter, fromBlock, "latest"),
      contract.queryFilter(consentGrantFilter, fromBlock, "latest"),
      contract.queryFilter(consentRevokeFilter, fromBlock, "latest"),
      contract.queryFilter(reviewFilter, fromBlock, "latest"),
    ]);

  return {
    clinicEvents,
    doctorEvents,
    recordEvents,
    consentGrantEvents,
    consentRevokeEvents,
    reviewEvents,
  };
}

export function txUrl(txHash: string) {
  return `https://amoy.polygonscan.com/tx/${txHash}`;
}

export function addressUrl(addr: string) {
  return `https://amoy.polygonscan.com/address/${addr}`;
}
