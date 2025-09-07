"use client"

import React, { useState } from "react"

interface ApiKeySetupProps {
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
  };
  onSetupComplete: () => void;
}

export default function ApiKeySetup({ user, onSetupComplete }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")
  const [showKey, setShowKey] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!apiKey.trim()) {
      setError("Please enter your Gemini API key")
      return
    }

    setIsValidating(true)
    setError("")

    try {
      const functions = window.firebase.functions()
      const setUserApiKey = functions.httpsCallable('setUserApiKey')
      
      const result = await setUserApiKey({
        userId: user.uid,
        apiKey: apiKey.trim()
      })

      if (result.data.success) {
        onSetupComplete()
      } else {
        setError(result.data.error || "Failed to save API key")
      }
    } catch (error) {
      console.error('API key setup error:', error)
      setError("Failed to validate API key. Please check your key and try again.")
    } finally {
      setIsValidating(false)
    }
  }

  const handleGetApiKey = () => {
    window.open('https://aistudio.google.com/app/apikey', '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.414-6.414A6 6 0 0119 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">API Key Setup</h2>
          <p className="text-gray-300 text-sm">
            Welcome, {user.displayName}! To generate project ideas, you need to provide your own Gemini API key.
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
          <h3 className="text-blue-400 font-semibold mb-2">Why do I need this?</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Your API key ensures reliable access to AI features</li>
            <li>• Keys are encrypted and stored securely</li>
            <li>• You maintain full control over your usage</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isValidating}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isValidating}
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

          {error && (
            <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

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
              disabled={isValidating || !apiKey.trim()}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center"
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
                "Save Key"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-2">
              Don't have a Gemini API key?
            </p>
            <button
              onClick={handleGetApiKey}
              className="text-green-400 hover:text-green-300 text-xs font-medium underline transition-colors"
            >
              Get one free from Google AI Studio →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
