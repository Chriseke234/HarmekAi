import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key buffer from SAGE_ENCRYPTION_KEY.
 * Throws explicitly if missing in production so secrets are never stored in plaintext.
 */
function getEncryptionKey(): Buffer {
  const rawKey = process.env.SAGE_ENCRYPTION_KEY;
  if (!rawKey || rawKey.length < 32) {
    if (process.env.NODE_ENV === "test") {
      return crypto.createHash("sha256").update("sage-ai-test-encryption-key").digest();
    }
    throw new Error(
      "SAGE_ENCRYPTION_KEY environment variable is required (minimum 32 characters)."
    );
  }
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }
  return crypto.createHash("sha256").update(rawKey).digest();
}

/**
 * Encrypts sensitive workspace credentials (such as optional LLM API keys)
 * using AES-256-GCM before persisting to server-only storage.
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts AES-256-GCM ciphertext stored in workspace_ai_credentials.
 */
export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret payload format.");
  }
  const [ivHex, tagHex, dataHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(dataHex, "hex");

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Malformed encryption parameters.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Returns the last 4 visible characters of an API key for safe display in settings.
 */
export function maskSecret(secret: string): string {
  const trimmed = secret.trim();
  if (trimmed.length <= 4) return "****";
  return trimmed.slice(-4);
}
