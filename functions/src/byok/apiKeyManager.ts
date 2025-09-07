/**
 * API Key management functions for BYOK implementation
 */

import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { encryptApiKey, decryptApiKey, isValidApiKeyFormat, maskApiKey } from './encryption';

// Interface for user API key data
export interface UserApiKeyData {
  userId: string;
  encryptedApiKey: string;
  keyStatus: 'valid' | 'invalid' | 'pending';
  lastValidated: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  usageCount: number;
  keyProvider: 'gemini';
}

/**
 * Test if a Gemini API key is valid by making a simple request
 */
export async function testGeminiApiKey(apiKey: string): Promise<boolean> {
  try {
    const ai = genkit({
      plugins: [googleAI({ apiKey })],
    });

    // Simple test request
    const { text } = await ai.generate({
      model: 'googleai/gemini-2.5-pro',
      prompt: 'Respond with just the word "test" if you can read this.',
      config: {
        maxOutputTokens: 10,
        temperature: 0,
      }
    });

    return text.toLowerCase().includes('test');
  } catch (error) {
    logger.warn(`API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Store encrypted API key for user
 */
export async function storeUserApiKey(userId: string, apiKey: string): Promise<void> {
  if (!userId || !apiKey) {
    throw new Error('User ID and API key are required');
  }

  if (!isValidApiKeyFormat(apiKey)) {
    throw new Error('Invalid API key format');
  }

  // Test API key validity
  const isValid = await testGeminiApiKey(apiKey);
  if (!isValid) {
    throw new Error('API key is invalid or cannot access Gemini AI');
  }

  // Encrypt the API key
  const encryptedKey = encryptApiKey(apiKey, userId);

  // Store in Firestore
  const db = admin.firestore();
  const keyData: UserApiKeyData = {
    userId,
    encryptedApiKey: encryptedKey,
    keyStatus: 'valid',
    lastValidated: admin.firestore.Timestamp.now(),
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    usageCount: 0,
    keyProvider: 'gemini'
  };

  await db.collection('userApiKeys').doc(userId).set(keyData);
  
  // Update user profile
  await db.collection('users').doc(userId).set({
    hasApiKey: true,
    apiKeyProvider: 'gemini',
    keySetupCompleted: true,
    lastUpdated: new Date().toISOString()
  }, { merge: true });

  logger.info(`API key stored for user: ${userId} (key: ${maskApiKey(apiKey)})`);
}

/**
 * Retrieve and decrypt user's API key
 */
export async function getUserApiKey(userId: string): Promise<string | null> {
  if (!userId) {
    return null;
  }

  try {
    const db = admin.firestore();
    const keyDoc = await db.collection('userApiKeys').doc(userId).get();

    if (!keyDoc.exists) {
      return null;
    }

    const keyData = keyDoc.data() as UserApiKeyData;
    
    if (keyData.keyStatus !== 'valid') {
      logger.warn(`User ${userId} has invalid API key status: ${keyData.keyStatus}`);
      return null;
    }

    // Decrypt the API key
    const decryptedKey = decryptApiKey(keyData.encryptedApiKey, userId);
    
    // Increment usage count
    await keyDoc.ref.update({
      usageCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.Timestamp.now()
    });

    return decryptedKey;
  } catch (error) {
    logger.error(`Error retrieving API key for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * Check if user has a valid API key
 */
export async function getUserApiKeyStatus(userId: string): Promise<{
  hasKey: boolean;
  isValid: boolean;
  lastValidated?: admin.firestore.Timestamp;
  usageCount?: number;
}> {
  if (!userId) {
    return { hasKey: false, isValid: false };
  }

  try {
    const db = admin.firestore();
    const keyDoc = await db.collection('userApiKeys').doc(userId).get();

    if (!keyDoc.exists) {
      return { hasKey: false, isValid: false };
    }

    const keyData = keyDoc.data() as UserApiKeyData;
    
    return {
      hasKey: true,
      isValid: keyData.keyStatus === 'valid',
      lastValidated: keyData.lastValidated,
      usageCount: keyData.usageCount
    };
  } catch (error) {
    logger.error(`Error checking API key status for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { hasKey: false, isValid: false };
  }
}

/**
 * Remove user's API key
 */
export async function removeUserApiKey(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const db = admin.firestore();
  
  // Remove from userApiKeys collection
  await db.collection('userApiKeys').doc(userId).delete();
  
  // Update user profile
  await db.collection('users').doc(userId).set({
    hasApiKey: false,
    apiKeyProvider: null,
    keySetupCompleted: false,
    lastUpdated: new Date().toISOString()
  }, { merge: true });

  logger.info(`API key removed for user: ${userId}`);
}

/**
 * Validate and update existing API key status
 */
export async function revalidateUserApiKey(userId: string): Promise<boolean> {
  const apiKey = await getUserApiKey(userId);
  if (!apiKey) {
    return false;
  }

  const isValid = await testGeminiApiKey(apiKey);
  
  // Update status in database
  const db = admin.firestore();
  await db.collection('userApiKeys').doc(userId).update({
    keyStatus: isValid ? 'valid' : 'invalid',
    lastValidated: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  });

  return isValid;
}
