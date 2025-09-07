import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './ApiKeyValidator.css';

interface ApiKeyValidatorProps {
  userId: string;
  onValidationComplete: (hasValidKey: boolean) => void;
  showSetupIfNeeded?: boolean;
}

interface ValidationResult {
  hasApiKey: boolean;
  isValid: boolean;
  needsSetup: boolean;
}

const ApiKeyValidator: React.FC<ApiKeyValidatorProps> = ({
  userId,
  onValidationComplete,
  showSetupIfNeeded = true
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);

  const functions = getFunctions();

  const validateUserApiKey = async () => {
    try {
      setLoading(true);
      setError('');

      const getUserApiKeyStatus = httpsCallable(functions, 'getUserApiKeyStatus');
      const result = await getUserApiKeyStatus({ userId });
      const status = result.data as any;

      const validationResult: ValidationResult = {
        hasApiKey: status.hasApiKey || false,
        isValid: status.isValid || false,
        needsSetup: !status.hasApiKey || !status.isValid
      };

      setValidationResult(validationResult);
      onValidationComplete(!validationResult.needsSetup);

      // Show setup if needed and allowed
      if (validationResult.needsSetup && showSetupIfNeeded) {
        setShowApiKeySetup(true);
      }

    } catch (err: any) {
      console.error('Error validating API key:', err);
      setError(err.message || 'Failed to validate API key');
      onValidationComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySetup = async (apiKey: string) => {
    try {
      setLoading(true);
      setError('');

      const setUserApiKey = httpsCallable(functions, 'setUserApiKey');
      await setUserApiKey({ userId, apiKey });

      setShowApiKeySetup(false);
      
      // Re-validate after setup
      await validateUserApiKey();

    } catch (err: any) {
      setError(err.message || 'Failed to set API key');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      validateUserApiKey();
    }
  }, [userId]);

  if (loading && !validationResult) {
    return (
      <div className="api-key-validator">
        <div className="validation-loading">
          <span className="spinner"></span>
          <span>Checking API key...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="api-key-validator">
        <div className="validation-error">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <h4>Validation Error</h4>
            <p>{error}</p>
            <button 
              onClick={validateUserApiKey}
              className="retry-btn"
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!validationResult) {
    return null;
  }

  if (validationResult.hasApiKey && validationResult.isValid) {
    return (
      <div className="api-key-validator">
        <div className="validation-success">
          <span className="success-icon">✅</span>
          <span className="success-text">API Key Ready</span>
        </div>
      </div>
    );
  }

  if (showApiKeySetup) {
    return (
      <div className="api-key-validator">
        <div className="setup-overlay">
          <div className="setup-container">
            <div className="setup-header">
              <h2>🔑 API Key Required</h2>
              <p>
                {!validationResult.hasApiKey 
                  ? "You need to add your Gemini API key to generate project ideas."
                  : "Your API key is invalid. Please update it to continue."
                }
              </p>
            </div>

            <div className="setup-instructions">
              <h3>How to get your API key:</h3>
              <ol>
                <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Click "Create API Key"</li>
                <li>Copy the generated key and paste it below</li>
              </ol>
            </div>

            <ApiKeySetupForm 
              onSubmit={handleApiKeySetup}
              loading={loading}
              error={error}
            />

            <div className="security-notice">
              <p><strong>🔒 Security:</strong> Your API key is encrypted and stored securely.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="api-key-validator">
      <div className="validation-warning">
        <span className="warning-icon">⚠️</span>
        <div className="warning-content">
          <h4>API Key Issue</h4>
          <p>
            {!validationResult.hasApiKey 
              ? "No API key found. You need to add your Gemini API key to generate project ideas."
              : "Your API key is invalid or expired. Please update it to continue."
            }
          </p>
          <button 
            onClick={() => setShowApiKeySetup(true)}
            className="setup-btn"
          >
            {!validationResult.hasApiKey ? 'Add API Key' : 'Update API Key'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Inline setup form component
const ApiKeySetupForm: React.FC<{
  onSubmit: (apiKey: string) => void;
  loading: boolean;
  error: string;
}> = ({ onSubmit, loading, error }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  const isValidFormat = apiKey.startsWith('AIza') && apiKey.length >= 39;

  return (
    <form onSubmit={handleSubmit} className="api-key-setup-form">
      <div className="input-group">
        <label htmlFor="apiKey">Gemini API Key</label>
        <div className="input-wrapper">
          <input
            type={showKey ? 'text' : 'password'}
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            disabled={loading}
            className={error ? 'error' : ''}
          />
          <button
            type="button"
            className="toggle-visibility"
            onClick={() => setShowKey(!showKey)}
            disabled={loading}
          >
            {showKey ? '👁️' : '🙈'}
          </button>
        </div>
        {!isValidFormat && apiKey.length > 0 && (
          <small className="format-hint">API key should start with "AIza" and be at least 39 characters</small>
        )}
        {error && <small className="error-message">{error}</small>}
      </div>

      <button 
        type="submit" 
        disabled={!isValidFormat || loading}
        className="submit-btn"
      >
        {loading ? (
          <>
            <span className="spinner"></span>
            Validating...
          </>
        ) : (
          'Save API Key'
        )}
      </button>
    </form>
  );
};

export default ApiKeyValidator;
