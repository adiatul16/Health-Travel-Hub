const PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

function getPinataJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT secret not set");
  return jwt;
}

export function isPinataConfigured(): boolean {
  return !!process.env.PINATA_JWT;
}

/**
 * Pin a buffer to IPFS via Pinata. Callers are responsible for encrypting
 * the buffer first if the content must stay private — IPFS content is
 * publicly fetchable by anyone who has the CID.
 */
export async function pinToIPFS(buffer: Buffer, fileName: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)]), fileName);

  const res = await fetch(PINATA_PIN_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${getPinataJwt()}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pinata upload failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { IpfsHash: string };
  return data.IpfsHash;
}

export async function fetchFromIPFS(cid: string): Promise<Buffer> {
  const res = await fetch(`${PINATA_GATEWAY}/${cid}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${cid} from IPFS (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function ipfsGatewayUrl(cid: string): string {
  return `${PINATA_GATEWAY}/${cid}`;
}
