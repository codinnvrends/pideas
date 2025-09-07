/**
 * Encryption utilities for BYOK (Bring Your Own Key) implementation
 * Handles secure storage and retrieval of user API keys
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Generate encryption key from user ID
 */
function deriveKeyFromUserId(userId: string): Buffer {
  const salt = Buffer.from(process.env.ENCRYPTION_SALT || 'pideas-default-salt', 'utf8');
  return crypto.pbkdf2Sync(userId, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt API key for storage
 */
export function encryptApiKey(apiKey: string, userId: string): string {
  try {
    const key = deriveKeyFromUserId(userId);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    cipher.setAAD(Buffer.from(userId, 'utf8'));
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv + tag + encrypted data
    const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt API key from storage
 */
export function decryptApiKey(encryptedData: string, userId: string): string {
  try {
    const key = deriveKeyFromUserId(userId);
    const combined = Buffer.from(encryptedData, 'base64');
    
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from(userId, 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate API key format (basic validation)
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Basic Gemini API key validation (starts with specific pattern)
  const geminiKeyPattern = /^AI[a-zA-Z0-9_-]{35,}$/;
  return geminiKeyPattern.test(apiKey.trim());
}

/**
 * Sanitize API key for logging (mask most characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
}
