import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MediaVerifier from './components/MediaVerifier';
import LiveLiveness from './components/LiveLiveness';
import ApiKeyModal from './components/ApiKeyModal';
import PhilosophyModal from './components/PhilosophyModal';
import RoadmapModal from './components/RoadmapModal';
import AskVeriLensDrawer from './components/AskVeriLensDrawer';
import { SAMPLE_CASES } from './data/sampleCases';
import { ShieldCheck, Scan, Eye, Heart, Layers, Camera, HelpCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'liveness'
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPhilosophyModalOpen, setIsPhilosophyModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
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

  const handleSelectSampleCase = (sample) => {
    setActiveImageSrc(sample.thumbnail);
    setCurrentMediaReport({
      filename: sample.metadata?.filename || sample.id,
      metadata: sample.metadata,
      ...sample.report
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080C14] text-slate-100 cyber-grid relative selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={!!apiKey}
        onOpenPhilosophyModal={() => setIsPhilosophyModalOpen(true)}
        onOpenRoadmapModal={() => setIsRoadmapModalOpen(true)}
        onSelectSampleCase={handleSelectSampleCase}
        samples={SAMPLE_CASES}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Tagline Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/40 border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                “Don’t just ask if it’s real. <span className="text-cyan-400 font-bold">See why.</span>”
              </p>
              <p className="text-xs text-slate-400">
                VeriLens replaces black-box percentages with transparent optical evidence, EXIF forensic telemetry, and liveness signals.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsPhilosophyModalOpen(true)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium flex items-center space-x-1.5 transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Evidence, Not Verdicts</span>
            </button>
          </div>
        </div>

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

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">VeriLens</span>
            <span>•</span>
            <span>Track: “Trust in a Synthetic World”</span>
            <span>•</span>
            <span className="text-cyan-400 font-mono">Gemini Multimodal Reasoning</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <button
              onClick={() => setIsPhilosophyModalOpen(true)}
              className="hover:text-cyan-300 transition"
            >
              Core Philosophy
            </button>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="hover:text-cyan-300 transition"
            >
              API Key Config
            </button>
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 transition"
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

      <PhilosophyModal
        isOpen={isPhilosophyModalOpen}
        onClose={() => setIsPhilosophyModalOpen(false)}
      />

      <RoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
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
