import React, { useState } from 'react';
import './ApiKeySetup.css';

interface ApiKeySetupProps {
  onApiKeySubmit: (apiKey: string) => void;
  isValidating?: boolean;
  error?: string;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ 
  onApiKeySubmit, 
  isValidating = false, 
  error 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  const isValidFormat = apiKey.startsWith('AIza') && apiKey.length >= 39;

  return (
    <div className="api-key-setup-overlay">
      <div className="api-key-setup-container">
        <div className="setup-header">
          <h2>🔑 Setup Your API Key</h2>
          <p>To generate project ideas, you'll need to provide your own Google Gemini API key.</p>
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

        <form onSubmit={handleSubmit} className="api-key-form">
          <div className="input-group">
            <label htmlFor="apiKey">Gemini API Key</label>
            <div className="input-wrapper">
              <input
                type={showKey ? 'text' : 'password'}
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                disabled={isValidating}
                className={error ? 'error' : ''}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowKey(!showKey)}
                disabled={isValidating}
              >
                {showKey ? '👁️' : '🙈'}
              </button>
            </div>
            {!isValidFormat && apiKey.length > 0 && (
              <small className="format-hint">API key should start with "AIza" and be at least 39 characters</small>
            )}
            {error && <small className="error-message">{error}</small>}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={!isValidFormat || isValidating}
              className="submit-btn"
            >
              {isValidating ? (
                <>
                  <span className="spinner"></span>
                  Validating...
                </>
              ) : (
                'Save API Key'
              )}
            </button>
          </div>
        </form>

        <div className="security-notice">
          <p><strong>🔒 Security Notice:</strong> Your API key is encrypted and stored securely. We never have access to your raw key.</p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;
