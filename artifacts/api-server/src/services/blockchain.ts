import { ethers } from "ethers";
import crypto from "crypto";

const CONTRACT_ABI = [
  "function anchor(string entityId, bytes32 documentHash, string issuer, string credentialType) external",
  "function getRecords(string entityId) view returns (tuple(bytes32 documentHash, string issuer, uint256 timestamp, string credentialType)[])",
  "function verify(string entityId, bytes32 documentHash) view returns (bool found, uint256 timestamp)",
  "function owner() view returns (address)",
  "event CredentialAnchored(string indexed entityId, bytes32 documentHash, string issuer, uint256 timestamp)",
];

const AMOY_RPC = "https://rpc-amoy.polygon.technology";

export function hashDocument(content: string): string {
  return "0x" + crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export function isBlockchainConfigured(): boolean {
  return !!(
    process.env.POLYGON_PRIVATE_KEY && process.env.CREDENTIAL_CONTRACT_ADDRESS
  );
}

function getProvider() {
  return new ethers.JsonRpcProvider(AMOY_RPC);
}

function getWallet() {
  const key = process.env.POLYGON_PRIVATE_KEY;
  if (!key) throw new Error("POLYGON_PRIVATE_KEY secret not set");
  return new ethers.Wallet(key, getProvider());
}

function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const address = process.env.CREDENTIAL_CONTRACT_ADDRESS;
  if (!address) throw new Error("CREDENTIAL_CONTRACT_ADDRESS secret not set");
  return new ethers.Contract(address, CONTRACT_ABI, signerOrProvider ?? getProvider());
}

export async function anchorCredential(
  entityId: string,
  documentHash: string,
  issuer: string,
  credentialType: string
): Promise<{ txHash: string; timestamp: Date }> {
  const wallet = getWallet();
  const contract = getContract(wallet);
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
  const contract = getContract();
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
  const contract = getContract();
  const verifyFn = contract["verify"] as (
    e: string,
    h: string
  ) => Promise<[boolean, bigint]>;
  const [found, ts] = await verifyFn(entityId, documentHash);
  return { found, timestamp: Number(ts) };
}
