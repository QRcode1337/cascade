import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.SECRETS_ENCRYPTION_KEY || 'default-key-change-in-production-32';
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): { cipherText: Buffer; iv: Buffer; authTag: Buffer } {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { cipherText: encrypted, iv, authTag };
}

export function decrypt(cipherText: Buffer, iv: Buffer, authTag: Buffer): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString('utf8');
}
