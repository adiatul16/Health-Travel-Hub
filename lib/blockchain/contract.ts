import { ethers, Contract, JsonRpcProvider } from "ethers";
import ledgerInfo from "./ledger.json";

export const AMOY_CHAIN_ID = 80002;
export const AMOY_RPC = "https://rpc-amoy.polygon.technology";
export const POLYGONSCAN_AMOY = "https://amoy.polygonscan.com";

const ABI = ledgerInfo.abi;
const CONTRACT_ADDRESS = ledgerInfo.address;

function getReadProvider() {
  return new JsonRpcProvider(AMOY_RPC);
}

function getReadContract() {
  if (!CONTRACT_ADDRESS) throw new Error("Contract not deployed yet");
  return new Contract(CONTRACT_ADDRESS, ABI, getReadProvider());
}

/* ─── Read functions (free, no wallet) ─── */
export async function isClinicVerified(clinicAddress: string) {
  const contract = getReadContract();
  return contract.isClinicVerified(clinicAddress);
}

export async function isDoctorVerified(doctorAddress: string) {
  const contract = getReadContract();
  return contract.isDoctorVerified(doctorAddress);
}

export async function getClinicInfo(clinicAddress: string) {
  const contract = getReadContract();
  return contract.clinics(clinicAddress);
}

export async function getDoctorInfo(doctorAddress: string) {
  const contract = getReadContract();
  return contract.doctors(doctorAddress);
}

export async function hasConsent(patient: string, doctor: string, recordHash: string) {
  const contract = getReadContract();
  return contract.hasConsent(patient, doctor, recordHash);
}

export async function getReviewCount(clinicAddress: string) {
  const contract = getReadContract();
  return contract.getReviewCount(clinicAddress);
}

export async function getRecordCount() {
  const contract = getReadContract();
  return contract.getRecordCount();
}

export async function hasOnChainInteraction(address: string) {
  const contract = getReadContract();
  return contract.hasOnChainInteraction(address);
}

/* ─── Events (free reads) ─── */
export async function getAllEvents() {
  const provider = getReadProvider();
  const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);

  const clinicFilter = contract.filters.ClinicVerified();
  const doctorFilter = contract.filters.DoctorVerified();
  const recordFilter = contract.filters.RecordAdded();
  const consentGrantFilter = contract.filters.ConsentGranted();
  const consentRevokeFilter = contract.filters.ConsentRevoked();
  const reviewFilter = contract.filters.ReviewAdded();

  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latestBlock - 50);

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
  return `${POLYGONSCAN_AMOY}/tx/${txHash}`;
}

export function addressUrl(addr: string) {
  return `${POLYGONSCAN_AMOY}/address/${addr}`;
}

/* ─── SHA-256 hash helper (browser-side) ─── */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
