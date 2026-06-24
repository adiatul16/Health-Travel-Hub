import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getMasterKey(): Buffer {
  const key = process.env.RECORDS_MASTER_KEY;
  if (!key) throw new Error("RECORDS_MASTER_KEY secret not set");
  return Buffer.from(key, "hex");
}

interface EncryptedPayload {
  ciphertext: Buffer;
  iv: string;
  authTag: string;
}

function encryptBuffer(plaintext: Buffer, key: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { ciphertext, iv: iv.toString("hex"), authTag: cipher.getAuthTag().toString("hex") };
}

function decryptBuffer(ciphertext: Buffer, key: Buffer, ivHex: string, authTagHex: string): Buffer {
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function generateRecordKey(): Buffer {
  return crypto.randomBytes(32);
}

export function sha256Hex(buf: Buffer): string {
  return "0x" + crypto.createHash("sha256").update(buf).digest("hex");
}

/** Encrypt file content with a fresh per-record key. */
export function encryptContent(plaintext: Buffer, recordKey: Buffer) {
  const { ciphertext, iv, authTag } = encryptBuffer(plaintext, recordKey);
  return { ciphertext, contentIv: iv, contentAuthTag: authTag };
}

export function decryptContent(ciphertext: Buffer, recordKey: Buffer, contentIv: string, contentAuthTag: string): Buffer {
  return decryptBuffer(ciphertext, recordKey, contentIv, contentAuthTag);
}

/** Envelope-encrypt the per-record key with the server master key, for storage in the DB. */
export function wrapRecordKey(recordKey: Buffer) {
  const { ciphertext, iv, authTag } = encryptBuffer(recordKey, getMasterKey());
  return {
    encKeyCiphertext: ciphertext.toString("base64"),
    encKeyIv: iv,
    encKeyAuthTag: authTag,
  };
}

export function unwrapRecordKey(encKeyCiphertext: string, encKeyIv: string, encKeyAuthTag: string): Buffer {
  return decryptBuffer(Buffer.from(encKeyCiphertext, "base64"), getMasterKey(), encKeyIv, encKeyAuthTag);
}
