import React, { useState } from 'react';
import { Key, Shield, Check, X, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [inputVal, setInputVal] = useState(apiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(inputVal.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setInputVal('');
    onSaveApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-50/30 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-sand-900 border border-sand-700/80 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-sand-400 hover:text-sand-200 hover:bg-sand-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-olive-950/80 border border-olive-800/80 rounded-xl text-olive-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-sand-50">Google Gemini API Key</h3>
            <p className="text-xs text-sand-400">Direct Multimodal Reasoning Engine</p>
          </div>
        </div>

        <p className="text-xs text-sand-300 leading-relaxed mb-4">
          VeriLens uses Google Gemini 2.5/2.0 Flash to synthesize multimodal visual, optical, and metadata evidence. You can supply your own API key, or use the pre-packaged forensic heuristic engine for instant judging.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-sand-300 mb-1.5">
              API Key (AI Studio)
            </label>
            <input
              type="password"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 bg-sand-950 border border-sand-700/80 rounded-xl text-sm text-sand-100 placeholder-sand-600 focus:outline-none focus:border-olive-500 focus:ring-1 focus:ring-olive-500 transition font-mono"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-sand-400">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-olive-400 hover:text-olive-300 hover:underline"
            >
              <span>Get a free key from Google AI Studio</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-burgundy-400 hover:text-burgundy-300 hover:underline"
              >
                Clear key
              </button>
            )}
          </div>

          <div className="p-3 bg-sand-950/60 border border-sand-800 rounded-xl text-[11px] text-sand-400 space-y-1">
            <div className="flex items-center space-x-1.5 text-sand-300 font-medium">
              <Shield className="w-3.5 h-3.5 text-olive-400" />
              <span>Client-Side Local Storage Privacy</span>
            </div>
            <p>
              Your key is saved locally in your browser session and only passed to Gemini endpoints.
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 text-xs font-semibold text-sand-400 hover:text-sand-200 bg-sand-800 hover:bg-sand-700/80 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-gradient-to-r from-burgundy-600 to-burgundy-600 hover:from-burgundy-500 hover:to-burgundy-500 rounded-xl shadow-lg shadow-olive-900/30 flex items-center justify-center space-x-1.5 transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-olive-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
