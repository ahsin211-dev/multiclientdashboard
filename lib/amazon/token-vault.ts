import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getSecret() {
  const secret = process.env.TOKEN_ENCRYPTION_SECRET ?? "dev-only-token-secret-please-change";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptToken(payload: string) {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 16);
  const tag = raw.subarray(16, 32);
  const encrypted = raw.subarray(32);
  const decipher = crypto.createDecipheriv(ALGORITHM, getSecret(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
