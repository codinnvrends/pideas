"use client"

import React, { useState, useEffect } from "react"

interface ApiKeyManagerProps {
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
  };
}

interface ApiKeyStatus {
  hasApiKey: boolean;
  keyStatus: string | null;
  lastValidated: any;
  usageCount: number;
  keyProvider: string;
  setupRequired: boolean;
}

export default function ApiKeyManager({ user }: ApiKeyManagerProps) {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [newApiKey, setNewApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadApiKeyStatus()
  }, [user.uid])

  const loadApiKeyStatus = async () => {
    try {
      const functions = window.firebase.functions()
      const getUserApiKeyStatus = functions.httpsCallable('getUserApiKeyStatus')
      
      const result = await getUserApiKeyStatus({ userId: user.uid })
      setStatus(result.data)
    } catch (error) {
      console.error('Error loading API key status:', error)
      setError("Failed to load API key status")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateApiKey = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newApiKey.trim()) {
      setError("Please enter your Gemini API key")
      return
    }

    setIsUpdating(true)
    setError("")
    setSuccess("")

    try {
      const functions = window.firebase.functions()
      const setUserApiKey = functions.httpsCallable('setUserApiKey')
      
      const result = await setUserApiKey({
        userId: user.uid,
        apiKey: newApiKey.trim()
      })

      if (result.data.success) {
        setSuccess("API key updated successfully!")
        setNewApiKey("")
        await loadApiKeyStatus()
      } else {
        setError(result.data.error || "Failed to update API key")
      }
    } catch (error) {
      console.error('API key update error:', error)
      setError("Failed to validate API key. Please check your key and try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleValidateKey = async () => {
    setIsValidating(true)
    setError("")
    setSuccess("")

    try {
      const functions = window.firebase.functions()
      const validateUserApiKey = functions.httpsCallable('validateUserApiKey')
      
      const result = await validateUserApiKey({ userId: user.uid })

      if (result.data.success) {
        if (result.data.isValid) {
          setSuccess("API key is valid!")
        } else {
          setError("API key is invalid. Please update it.")
        }
        await loadApiKeyStatus()
      } else {
        setError(result.data.error || "Failed to validate API key")
      }
    } catch (error) {
      console.error('API key validation error:', error)
      setError("Failed to validate API key")
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveKey = async () => {
    if (!confirm("Are you sure you want to remove your API key? You won't be able to generate project ideas until you add a new one.")) {
      return
    }

    setIsRemoving(true)
    setError("")
    setSuccess("")

    try {
      const functions = window.firebase.functions()
      const removeUserApiKey = functions.httpsCallable('removeUserApiKey')
      
      const result = await removeUserApiKey({ userId: user.uid })

      if (result.data.success) {
        setSuccess("API key removed successfully")
        await loadApiKeyStatus()
      } else {
        setError(result.data.error || "Failed to remove API key")
      }
    } catch (error) {
      console.error('API key removal error:', error)
      setError("Failed to remove API key")
    } finally {
      setIsRemoving(false)
    }
  }

  const handleGetApiKey = () => {
    window.open('https://aistudio.google.com/app/apikey', '_blank')
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Never"
    
    try {
      let date: Date
      if (timestamp.seconds) {
        // Firestore timestamp
        date = new Date(timestamp.seconds * 1000)
      } else {
        date = new Date(timestamp)
      }
      return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    } catch {
      return "Invalid date"
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-600 rounded mb-4"></div>
            <div className="h-4 bg-gray-600 rounded mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* API Key Status Card */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">API Key Status</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            status?.hasApiKey && status?.keyStatus === 'valid' 
              ? 'bg-green-600/20 text-green-400 border border-green-600/30'
              : 'bg-red-600/20 text-red-400 border border-red-600/30'
          }`}>
            {status?.hasApiKey && status?.keyStatus === 'valid' ? 'Active' : 'Not Set'}
          </div>
        </div>

        {status?.hasApiKey ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Provider:</span>
                <span className="text-white ml-2 capitalize">{status.keyProvider}</span>
              </div>
              <div>
                <span className="text-gray-400">Usage Count:</span>
                <span className="text-white ml-2">{status.usageCount}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Last Validated:</span>
                <span className="text-white ml-2">{formatDate(status.lastValidated)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={handleValidateKey}
                disabled={isValidating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 text-sm font-medium flex items-center"
              >
                {isValidating ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </>
                ) : (
                  "Validate Key"
                )}
              </button>
              <button
                onClick={handleRemoveKey}
                disabled={isRemoving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 text-sm font-medium flex items-center"
              >
                {isRemoving ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Removing...
                  </>
                ) : (
                  "Remove Key"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-4">No API key configured</p>
            <button
              onClick={handleGetApiKey}
              className="text-green-400 hover:text-green-300 text-sm font-medium underline transition-colors"
            >
              Get a free API key from Google AI Studio →
            </button>
          </div>
        )}
      </div>

      {/* Update API Key Form */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          {status?.hasApiKey ? 'Update API Key' : 'Add API Key'}
        </h3>

        <form onSubmit={handleUpdateApiKey} className="space-y-4">
          <div>
            <label htmlFor="newApiKey" className="block text-sm font-medium text-gray-300 mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                id="newApiKey"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter your new Gemini API key..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isUpdating}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isUpdating}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showKey ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGetApiKey}
              className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              Get API Key
            </button>
            <button
              type="submit"
              disabled={isUpdating || !newApiKey.trim()}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center"
            >
              {isUpdating ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {status?.hasApiKey ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                status?.hasApiKey ? 'Update Key' : 'Save Key'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold mb-2">Security & Privacy</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Your API key is encrypted using AES-256-CBC before storage</li>
          <li>• Only you can access your encrypted API key</li>
          <li>• Keys are used only for generating your project ideas</li>
          <li>• You can remove your key at any time</li>
        </ul>
      </div>
    </div>
  )
}
