import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MediaVerifier from './components/MediaVerifier';
import LiveLiveness from './components/LiveLiveness';
import ApiKeyModal from './components/ApiKeyModal';
import PhilosophyPage from './components/PhilosophyPage';
import RoadmapPage from './components/RoadmapPage';
import AskVeriLensDrawer from './components/AskVeriLensDrawer';
import ZkProofVault from './components/ZkProofVault';
import { SAMPLE_CASES } from './data/sampleCases';
import { ShieldCheck, Scan, Eye, Heart, Layers, Camera, HelpCircle, Sparkles, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'liveness' | 'zk' | 'philosophy' | 'roadmap'
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  // Active Media report state initialized with first sample for immediate wow factor!
  const defaultSample = SAMPLE_CASES[0];
  const [activeImageSrc, setActiveImageSrc] = useState(defaultSample.thumbnail);
  const [currentMediaReport, setCurrentMediaReport] = useState({
    filename: defaultSample.metadata?.filename,
    metadata: defaultSample.metadata,
    ...defaultSample.report
  });

  // Load API key from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('verilens_gemini_key');
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('verilens_gemini_key', newKey);
    } else {
      localStorage.removeItem('verilens_gemini_key');
    }
  };

  const openPhilosophy = () => {
    setActiveTab('philosophy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream text-sand-100 relative selection:bg-olive-500/30 selection:text-olive-200">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={!!apiKey}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Tab Views */}
        {activeTab === 'media' && (
          <MediaVerifier
            apiKey={apiKey}
            onOpenChat={() => setIsChatDrawerOpen(true)}
            samples={SAMPLE_CASES}
            currentReport={currentMediaReport}
            setCurrentReport={setCurrentMediaReport}
            activeImageSrc={activeImageSrc}
            setActiveImageSrc={setActiveImageSrc}
          />
        )}

        {activeTab === 'liveness' && (
          <LiveLiveness
            apiKey={apiKey}
            onOpenChat={() => setIsChatDrawerOpen(true)}
          />
        )}

        {activeTab === 'zk' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 p-4 rounded-2xl glass-panel border border-sand-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-sand-50 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-olive-400" />
                  <span>Zero-Knowledge Privacy Studio</span>
                </h2>
                <p className="text-xs text-sand-400 mt-0.5">
                  Generate cryptographic proofs that protect your identity. Prove you're real without revealing who you are.
                </p>
              </div>
            </div>
            <ZkProofVault
              livenessReport={currentMediaReport}
              capturedFrames={{}}
              mediaReport={currentMediaReport}
              imageHash={currentMediaReport?.metadata?.md5_hash || ''}
            />
          </div>
        )}

        {activeTab === 'philosophy' && (
          <PhilosophyPage setActiveTab={setActiveTab} />
        )}

        {activeTab === 'roadmap' && (
          <RoadmapPage setActiveTab={setActiveTab} />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full bg-olive-600 py-6 text-xs text-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">VeriLens</span>
            <span>•</span>
            <span>Track: “Trust in a Synthetic World”</span>
            <span>•</span>
            <span className="text-olive-800 font-mono">Gemini Multimodal Reasoning</span>
          </div>

          <div className="flex items-center space-x-4 text-white/80">
            <button
              onClick={openPhilosophy}
              className="hover:text-white transition"
            >
              Core Philosophy
            </button>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="hover:text-white transition"
            >
              API Key Config
            </button>
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Google AI Studio
            </a>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      <AskVeriLensDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        reportContext={currentMediaReport}
        apiKey={apiKey}
      />

    </div>
  );
}
