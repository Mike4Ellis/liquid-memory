/**
 * End-to-End Encryption for Liquid Memory
 * US-018: Client-side encryption with AES-GCM
 */

// ==================== Types ====================

export interface EncryptedData {
  ciphertext: string;      // Base64 encoded encrypted data
  iv: string;              // Base64 encoded initialization vector
  salt: string;            // Base64 encoded salt for key derivation
  version: number;         // Encryption version for future compatibility
}

export interface EncryptionKey {
  key: CryptoKey;
  salt: Uint8Array;
}

const ENCRYPTION_VERSION = 1;
const KEY_ITERATIONS = 100000;
const KEY_LENGTH = 256;

// ==================== Key Derivation ====================

/**
 * Derive encryption key from user password
 * Uses PBKDF2 for secure key derivation
 */
export async function deriveKeyFromPassword(
  password: string,
  providedSalt?: Uint8Array
): Promise<EncryptionKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Generate or use provided salt
  const salt = providedSalt || crypto.getRandomValues(new Uint8Array(16));
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES-GCM key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
  
  return { key, salt };
}

/**
 * Generate a random encryption key (for data encryption without password)
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to raw bytes (for storage)
 */
export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
}

/**
 * Import key from raw bytes
 */
export async function importKey(keyData: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ==================== Encryption / Decryption ====================

/**
 * Encrypt data with AES-GCM
 */
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(data);
  
  // Generate random IV (12 bytes recommended for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Generate salt for this encryption (used for key verification)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    plaintext.buffer as ArrayBuffer
  );
  
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    version: ENCRYPTION_VERSION,
  };
}

/**
 * Decrypt data with AES-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: invalid key or corrupted data');
  }
}

/**
 * Encrypt file (image) before upload
 */
export async function encryptFile(
  file: File | Blob,
  key: CryptoKey
): Promise<{ encryptedData: EncryptedData; encryptedBlob: Blob }> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Generate IV and salt
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Encrypt the file data
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    arrayBuffer
  );
  
  const encryptedData: EncryptedData = {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    version: ENCRYPTION_VERSION,
  };
  
  return {
    encryptedData,
    encryptedBlob: new Blob([ciphertext]),
  };
}

/**
 * Decrypt file after download
 */
export async function decryptFile(
  encryptedBlob: Blob,
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<Blob> {
  const ciphertext = await encryptedBlob.arrayBuffer();
  const iv = base64ToArrayBuffer(encryptedData.iv);
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    
    return new Blob([decrypted]);
  } catch (error) {
    throw new Error('File decryption failed: invalid key or corrupted data');
  }
}

// ==================== Image-specific Encryption ====================

/**
 * Encrypt image data URL for storage
 */
export async function encryptImageDataUrl(
  dataUrl: string,
  password: string
): Promise<{ encrypted: EncryptedData; keyHash: string }> {
  const { key, salt } = await deriveKeyFromPassword(password);
  const encrypted = await encryptData(dataUrl, key);
  
  // Create a hash of the key for verification (not the key itself!)
  const keyData = await exportKey(key);
  const keyHashBuffer = await crypto.subtle.digest('SHA-256', keyData.buffer as ArrayBuffer);
  const keyHash = arrayBufferToBase64(keyHashBuffer);
  
  return { encrypted, keyHash };
}

/**
 * Decrypt image data URL
 */
export async function decryptImageDataUrl(
  encrypted: EncryptedData,
  password: string
): Promise<string> {
  const salt = base64ToArrayBuffer(encrypted.salt);
  const { key } = await deriveKeyFromPassword(password, new Uint8Array(salt));
  
  return await decryptData(encrypted, key);
}

/**
 * Verify password against stored key hash
 */
export async function verifyPassword(
  password: string,
  storedKeyHash: string,
  salt: Uint8Array
): Promise<boolean> {
  try {
    const { key } = await deriveKeyFromPassword(password, salt);
    const keyData = await exportKey(key);
    const keyHashBuffer = await crypto.subtle.digest('SHA-256', keyData.buffer as ArrayBuffer);
    const keyHash = arrayBufferToBase64(keyHashBuffer);
    
    return keyHash === storedKeyHash;
  } catch {
    return false;
  }
}

// ==================== Utility Functions ====================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ==================== Secure Storage ====================

const MASTER_KEY_STORAGE = 'liquid-memory-master-key';
const KEY_HASH_STORAGE = 'liquid-memory-key-hash';

/**
 * Store encrypted master key in localStorage
 * The master key itself is encrypted with a password-derived key
 */
export async function storeMasterKey(
  masterKey: CryptoKey,
  password: string
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Export master key
  const keyData = await exportKey(masterKey);
  
  // Encrypt master key with password-derived key
  const { encrypted, keyHash } = await encryptImageDataUrl(
    arrayBufferToBase64(keyData.buffer as ArrayBuffer),
    password
  );
  
  localStorage.setItem(MASTER_KEY_STORAGE, JSON.stringify(encrypted));
  localStorage.setItem(KEY_HASH_STORAGE, keyHash);
}

/**
 * Retrieve and decrypt master key
 */
export async function retrieveMasterKey(password: string): Promise<CryptoKey | null> {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(MASTER_KEY_STORAGE);
  const keyHash = localStorage.getItem(KEY_HASH_STORAGE);
  
  if (!stored || !keyHash) return null;
  
  try {
    const encrypted: EncryptedData = JSON.parse(stored);
    const keyDataBase64 = await decryptImageDataUrl(encrypted, password);
    const keyData = base64ToArrayBuffer(keyDataBase64);
    
    return await importKey(new Uint8Array(keyData));
  } catch {
    return null;
  }
}

/**
 * Check if encryption is set up
 */
export function isEncryptionSetup(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(MASTER_KEY_STORAGE);
}

/**
 * Clear all encryption keys (logout)
 */
export function clearEncryptionKeys(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MASTER_KEY_STORAGE);
  localStorage.removeItem(KEY_HASH_STORAGE);
}

// ==================== High-level API ====================

export interface EncryptionManager {
  isEnabled: boolean;
  isSetup: boolean;
  enable: (password: string) => Promise<void>;
  disable: () => void;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  encrypt: (data: string) => Promise<EncryptedData>;
  decrypt: (data: EncryptedData) => Promise<string>;
}

/**
 * Create encryption manager instance
 */
export function createEncryptionManager(): EncryptionManager {
  let currentKey: CryptoKey | null = null;
  
  return {
    get isEnabled() {
      return currentKey !== null;
    },
    
    get isSetup() {
      return isEncryptionSetup();
    },
    
    async enable(password: string): Promise<void> {
      // Generate new master key
      const masterKey = await generateEncryptionKey();
      await storeMasterKey(masterKey, password);
      currentKey = masterKey;
    },
    
    disable(): void {
      currentKey = null;
      clearEncryptionKeys();
    },
    
    async unlock(password: string): Promise<boolean> {
      const key = await retrieveMasterKey(password);
      if (key) {
        currentKey = key;
        return true;
      }
      return false;
    },
    
    lock(): void {
      currentKey = null;
    },
    
    async encrypt(data: string): Promise<EncryptedData> {
      if (!currentKey) throw new Error('Encryption not enabled');
      return encryptData(data, currentKey);
    },
    
    async decrypt(data: EncryptedData): Promise<string> {
      if (!currentKey) throw new Error('Encryption not enabled');
      return decryptData(data, currentKey);
    },
  };
}
