import React from 'react';
import { 
  ShieldCheck, 
  Scan, 
  Key, 
  Sparkles, 
  HelpCircle, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  Layers,
  Compass,
  Shield
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenApiKeyModal, 
  hasApiKey, 
  onOpenPhilosophyModal,
  onOpenRoadmapModal,
  onSelectSampleCase,
  samples
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090D16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Philosophy Tag */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Scan className="w-5 h-5 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#090D16] rounded-full" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Veri<span className="text-cyan-400">Lens</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  Trust in a Synthetic World
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                “Don’t just ask if it’s real. <span className="text-cyan-400 font-semibold">See why.</span>”
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'media'
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Media Trust Report</span>
            </button>

            <button
              onClick={() => setActiveTab('liveness')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'liveness'
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Identity Check</span>
            </button>

            <button
              onClick={() => setActiveTab('zk')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === 'zk'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>ZK Privacy</span>
            </button>

            <button
              onClick={onOpenPhilosophyModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Evidence Philosophy</span>
            </button>

            <button
              onClick={onOpenRoadmapModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Future Roadmap</span>
            </button>
          </nav>

          {/* Right Actions: API Key & Presets */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Demo Dropdown */}
            <div className="relative group hidden lg:block">
              <button 
                type="button"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Presets</span>
              </button>
              
              <div className="absolute right-0 mt-1 w-64 p-1 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl hidden group-hover:block transition-all z-50">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Load Pre-Analyzed Test Cases
                </div>
                {samples && samples.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setActiveTab('media');
                      onSelectSampleCase(sample);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-cyan-950/40 hover:text-cyan-200 transition text-slate-200 flex flex-col"
                  >
                    <span className="font-semibold">{sample.title.split('(')[0]}</span>
                    <span className="text-[10px] text-slate-400">{sample.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key Config Button */}
            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                hasApiKey 
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40' 
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-500/60 hover:text-cyan-300'
              }`}
              title="Configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {hasApiKey ? 'Gemini Key Configured' : 'Add Gemini Key'}
              </span>
              <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between pb-3 pt-1 border-t border-slate-800/60">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === 'media' ? 'bg-cyan-600 text-white' : 'text-slate-400'
              }`}
            >
              Media Report
            </button>
            <button
              onClick={() => setActiveTab('liveness')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === 'liveness' ? 'bg-cyan-600 text-white' : 'text-slate-400'
              }`}
            >
              Live Check
            </button>
            <button
              onClick={() => setActiveTab('zk')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === 'zk' ? 'bg-violet-600 text-white' : 'text-slate-400'
              }`}
            >
              ZK Privacy
            </button>
          </div>
          <button
            onClick={onOpenPhilosophyModal}
            className="text-xs text-cyan-400 flex items-center space-x-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Philosophy</span>
          </button>
        </div>

      </div>
    </header>
  );
}
