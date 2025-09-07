import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './ApiKeyManager.css';

interface ApiKeyStatus {
  hasApiKey: boolean;
  isValid: boolean;
  lastValidated?: string;
  usageCount?: number;
  maskedKey?: string;
}

interface ApiKeyManagerProps {
  userId: string;
  onApiKeyChange?: () => void;
  compact?: boolean;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  userId, 
  onApiKeyChange,
  compact = false 
}) => {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [error, setError] = useState('');

  const functions = getFunctions();

  const loadApiKeyStatus = async () => {
    try {
      setLoading(true);
      const getUserApiKeyStatus = httpsCallable(functions, 'getUserApiKeyStatus');
      const result = await getUserApiKeyStatus({ userId });
      setStatus(result.data as ApiKeyStatus);
    } catch (err) {
      console.error('Error loading API key status:', err);
      setError('Failed to load API key status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApiKey = async (apiKey: string) => {
    try {
      setUpdating(true);
      setError('');
      
      const setUserApiKey = httpsCallable(functions, 'setUserApiKey');
      await setUserApiKey({ userId, apiKey });
      
      setShowUpdateForm(false);
      setNewApiKey('');
      await loadApiKeyStatus();
      onApiKeyChange?.();
    } catch (err: any) {
      setError(err.message || 'Failed to update API key');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!confirm('Are you sure you want to remove your API key? You won\'t be able to generate project ideas until you add a new one.')) {
      return;
    }

    try {
      setUpdating(true);
      const removeUserApiKey = httpsCallable(functions, 'removeUserApiKey');
      await removeUserApiKey({ userId });
      
      await loadApiKeyStatus();
      onApiKeyChange?.();
    } catch (err: any) {
      setError(err.message || 'Failed to remove API key');
    } finally {
      setUpdating(false);
    }
  };

  const handleRevalidateApiKey = async () => {
    try {
      setUpdating(true);
      setError('');
      
      const revalidateUserApiKey = httpsCallable(functions, 'revalidateUserApiKey');
      const result = await revalidateUserApiKey({ userId });
      
      if (!(result.data as any).valid) {
        setError('Your API key is no longer valid. Please update it.');
      }
      
      await loadApiKeyStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to revalidate API key');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadApiKeyStatus();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className={`api-key-manager ${compact ? 'compact' : ''}`}>
        <div className="loading-state">
          <span className="spinner"></span>
          Loading API key status...
        </div>
      </div>
    );
  }

  if (compact && status?.hasApiKey && status?.isValid) {
    return (
      <div className="api-key-manager compact">
        <div className="key-status-indicator valid">
          <span className="status-icon">🔑</span>
          <span className="status-text">API Key Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`api-key-manager ${compact ? 'compact' : ''}`}>
      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          {error}
          <button onClick={() => setError('')} className="dismiss-btn">×</button>
        </div>
      )}

      <div className="manager-header">
        <h3>🔑 API Key Management</h3>
        <p>Manage your Gemini API key for generating project ideas</p>
      </div>

      {status?.hasApiKey ? (
        <div className="key-status-card">
          <div className={`status-indicator ${status.isValid ? 'valid' : 'invalid'}`}>
            <span className="status-icon">
              {status.isValid ? '✅' : '❌'}
            </span>
            <div className="status-details">
              <div className="status-title">
                {status.isValid ? 'API Key Active' : 'API Key Invalid'}
              </div>
              <div className="status-subtitle">
                {status.maskedKey && `Key: ${status.maskedKey}`}
                {status.usageCount !== undefined && ` • Used ${status.usageCount} times`}
                {status.lastValidated && ` • Last checked: ${new Date(status.lastValidated).toLocaleDateString()}`}
              </div>
            </div>
          </div>

          <div className="key-actions">
            <button 
              onClick={handleRevalidateApiKey}
              disabled={updating}
              className="action-btn secondary"
            >
              {updating ? 'Checking...' : 'Revalidate'}
            </button>
            
            <button 
              onClick={() => setShowUpdateForm(true)}
              disabled={updating}
              className="action-btn primary"
            >
              Update Key
            </button>
            
            <button 
              onClick={handleRemoveApiKey}
              disabled={updating}
              className="action-btn danger"
            >
              Remove Key
            </button>
          </div>
        </div>
      ) : (
        <div className="no-key-state">
          <div className="no-key-message">
            <span className="icon">🚫</span>
            <h4>No API Key Found</h4>
            <p>Add your Gemini API key to start generating project ideas</p>
          </div>
          
          <button 
            onClick={() => setShowUpdateForm(true)}
            className="action-btn primary large"
          >
            Add API Key
          </button>
        </div>
      )}

      {showUpdateForm && (
        <div className="update-form-overlay">
          <div className="update-form">
            <div className="form-header">
              <h4>{status?.hasApiKey ? 'Update API Key' : 'Add API Key'}</h4>
              <button 
                onClick={() => setShowUpdateForm(false)}
                className="close-btn"
                disabled={updating}
              >
                ×
              </button>
            </div>
            
            <div className="form-content">
              <div className="input-group">
                <label>Gemini API Key</label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="AIza..."
                  disabled={updating}
                />
                <small>Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></small>
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={() => setShowUpdateForm(false)}
                  disabled={updating}
                  className="action-btn secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleUpdateApiKey(newApiKey)}
                  disabled={!newApiKey.trim() || updating}
                  className="action-btn primary"
                >
                  {updating ? 'Saving...' : 'Save Key'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;
