import { getServerRuntimeSecret } from '@/lib/server/cashfree';

export interface SensitiveBankPayload {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'SAVINGS' | 'CURRENT';
  timestamp: string;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Derives a strict 32-byte (256-bit) CryptoKey from the Cloudflare Worker secret.
 * Resolves PAYOUT_ENCRYPTION_KEY or BANK_ENCRYPTION_KEY from runtime secrets.
 * Edge-compatible using Web Crypto API.
 */
async function getEncryptionCryptoKey(): Promise<CryptoKey> {
  const rawKey =
    getServerRuntimeSecret('PAYOUT_ENCRYPTION_KEY') ||
    getServerRuntimeSecret('BANK_ENCRYPTION_KEY') ||
    process.env.PAYOUT_ENCRYPTION_KEY ||
    process.env.BANK_ENCRYPTION_KEY;

  let keyBytes: Uint8Array;
  if (rawKey && rawKey.trim().length > 0) {
    const trimmed = rawKey.trim();
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      keyBytes = hexToBytes(trimmed);
    } else {
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(trimmed));
      keyBytes = new Uint8Array(hash);
    }
  } else {
    // Development fallback key
    const devSeed = 'marketmyidea_payout_aes_gcm_dev_secret_key_v1';
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(devSeed));
    keyBytes = new Uint8Array(hash);
  }

  return crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts sensitive bank details using standard Web Crypto AES-256-GCM.
 * Output format: `<iv_hex>:<tag_hex>:<ciphertext_hex>`
 */
export async function encryptBankPayload(payload: SensitiveBankPayload): Promise<string> {
  const key = await getEncryptionCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Standard 96-bit IV
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource, tagLength: 128 },
    key,
    plaintext
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  // Web Crypto appends the 16-byte authentication tag at the end of ciphertext
  const ciphertextBytes = encryptedBytes.slice(0, -16);
  const tagBytes = encryptedBytes.slice(-16);

  return `${bytesToHex(iv)}:${bytesToHex(tagBytes)}:${bytesToHex(ciphertextBytes)}`;
}

/**
 * Decrypts an AES-256-GCM payload using Web Crypto.
 * Verifies authenticity tag to prevent tampering.
 */
export async function decryptBankPayload(encryptedString: string): Promise<SensitiveBankPayload> {
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload structure');
  }

  const [ivHex, tagHex, ciphertextHex] = parts;
  const iv = hexToBytes(ivHex);
  const tag = hexToBytes(tagHex);
  const ciphertext = hexToBytes(ciphertextHex);

  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const key = await getEncryptionCryptoKey();
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource, tagLength: 128 },
    key,
    combined as unknown as BufferSource
  );

  const decryptedText = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decryptedText) as SensitiveBankPayload;
}
