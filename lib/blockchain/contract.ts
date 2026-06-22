import { ethers, BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import ledgerInfo from "./ledger.json";

export const AMOY_CHAIN_ID = 80002;
export const AMOY_RPC = "https://rpc-amoy.polygon.technology";
export const POLYGONSCAN_AMOY = "https://amoy.polygonscan.com";

const ABI = ledgerInfo.abi;
const CONTRACT_ADDRESS = ledgerInfo.address;

/* ─── Provider / read-only ─── */
function getReadProvider() {
  return new JsonRpcProvider(AMOY_RPC);
}

function getReadContract() {
  if (!CONTRACT_ADDRESS) throw new Error("Contract not deployed yet");
  return new Contract(CONTRACT_ADDRESS, ABI, getReadProvider());
}

/* ─── MetaMask / signer ─── */
export async function getSigner() {
  if (!(window as any).ethereum) throw new Error("MetaMask not installed");
  const provider = new BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export async function getWriteContract() {
  const signer = await getSigner();
  if (!CONTRACT_ADDRESS) throw new Error("Contract not deployed yet");
  return new Contract(CONTRACT_ADDRESS, ABI, signer);
}

export async function ensureAmoyNetwork() {
  if (!(window as any).ethereum) throw new Error("MetaMask not installed");
  const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
  if (Number(chainId) !== AMOY_CHAIN_ID) {
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + AMOY_CHAIN_ID.toString(16) }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x" + AMOY_CHAIN_ID.toString(16),
              chainName: "Polygon Amoy",
              nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
              rpcUrls: [AMOY_RPC],
              blockExplorerUrls: [POLYGONSCAN_AMOY],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }
}

export async function getConnectedAddress() {
  if (!(window as any).ethereum) return null;
  const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
  return accounts[0] ?? null;
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

  const [clinicEvents, doctorEvents, recordEvents, consentGrantEvents, consentRevokeEvents, reviewEvents] =
    await Promise.all([
      contract.queryFilter(clinicFilter),
      contract.queryFilter(doctorFilter),
      contract.queryFilter(recordFilter),
      contract.queryFilter(consentGrantFilter),
      contract.queryFilter(consentRevokeFilter),
      contract.queryFilter(reviewFilter),
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

/* ─── Write helpers (requires MetaMask) ─── */
export async function verifyClinic(
  clinic: string,
  name: string,
  accreditation: string,
  expiryDays: number
) {
  const contract = await getWriteContract();
  const expiry = Math.floor(Date.now() / 1000) + expiryDays * 24 * 3600;
  const tx = await contract.verifyClinic(clinic, name, accreditation, expiry);
  await tx.wait();
  return tx.hash;
}

export async function verifyDoctor(
  doctor: string,
  clinic: string,
  license: string,
  expiryDays: number
) {
  const contract = await getWriteContract();
  const expiry = Math.floor(Date.now() / 1000) + expiryDays * 24 * 3600;
  const tx = await contract.verifyDoctor(doctor, clinic, license, expiry);
  await tx.wait();
  return tx.hash;
}

export async function addRecord(dataHash: string, ref: string, phase: string) {
  const contract = await getWriteContract();
  const tx = await contract.addRecord(dataHash, ref, phase);
  await tx.wait();
  return tx.hash;
}

export async function grantConsent(doctor: string, recordHash: string) {
  const contract = await getWriteContract();
  const tx = await contract.grantConsent(doctor, recordHash);
  await tx.wait();
  return tx.hash;
}

export async function revokeConsent(doctor: string, recordHash: string) {
  const contract = await getWriteContract();
  const tx = await contract.revokeConsent(doctor, recordHash);
  await tx.wait();
  return tx.hash;
}

export async function addReview(clinic: string, rating: number, comment: string) {
  const contract = await getWriteContract();
  const tx = await contract.addReview(clinic, rating, comment);
  await tx.wait();
  return tx.hash;
}

/* ─── SHA-256 hash helper (browser-side) ─── */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
