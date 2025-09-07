/**
 * Firebase Functions for BYOK API key management
 */

import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { storeUserApiKey, getUserApiKeyStatus as getApiKeyStatus, removeUserApiKey as deleteUserApiKey, revalidateUserApiKey as revalidateApiKey, testGeminiApiKey } from './apiKeyManager';
import { isValidApiKeyFormat } from './encryption';

/**
 * Set/Update user's API key
 */
export const setUserApiKey = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const { userId, apiKey } = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error("Valid API key is required");
    }

    // Basic format validation
    if (!isValidApiKeyFormat(apiKey.trim())) {
      throw new Error("Invalid API key format. Please ensure you're using a valid Gemini API key.");
    }

    // Store the API key (this includes validation)
    await storeUserApiKey(userId, apiKey.trim());

    return {
      success: true,
      message: "API key saved and validated successfully"
    };

  } catch (error) {
    logger.error("Error setting user API key:", error);
    throw new Error(`Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Validate user's API key without storing it
 */
export const validateApiKey = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const { apiKey } = request.data;

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error("API key is required for validation");
    }

    // Basic format validation
    if (!isValidApiKeyFormat(apiKey.trim())) {
      return {
        success: false,
        valid: false,
        message: "Invalid API key format"
      };
    }

    // Test the API key
    const isValid = await testGeminiApiKey(apiKey.trim());

    return {
      success: true,
      valid: isValid,
      message: isValid ? "API key is valid" : "API key is invalid or cannot access Gemini AI"
    };

  } catch (error) {
    logger.error("Error validating API key:", error);
    return {
      success: false,
      valid: false,
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
});

/**
 * Get user's API key status
 */
export const getUserApiKeyStatus = onCall({maxInstances: 5}, async (request: any) => {
  try {
    const { userId } = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    const status = await getApiKeyStatus(userId);

    return {
      success: true,
      ...status
    };

  } catch (error) {
    logger.error("Error getting API key status:", error);
    throw new Error(`Failed to get API key status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Remove user's API key
 */
export const removeUserApiKey = onCall({maxInstances: 3}, async (request: any) => {
  try {
    const { userId } = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    await deleteUserApiKey(userId);

    return {
      success: true,
      message: "API key removed successfully"
    };

  } catch (error) {
    logger.error("Error removing API key:", error);
    throw new Error(`Failed to remove API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Revalidate user's existing API key
 */
export const revalidateUserApiKey = onCall({maxInstances: 3}, async (request: any) => {
  try {
    const { userId } = request.data;

    if (!userId) {
      throw new Error("User ID is required");
    }

    const isValid = await revalidateApiKey(userId);

    return {
      success: true,
      valid: isValid,
      message: isValid ? "API key is valid" : "API key is invalid"
    };

  } catch (error) {
    logger.error("Error revalidating API key:", error);
    throw new Error(`Failed to revalidate API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
