import React from 'react';
import { 
  ShieldCheck, 
  Scan, 
  Key, 
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
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-sand-800/80 bg-cream/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Philosophy Tag */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-navy-600 via-navy-500 to-navy-600 text-white shadow-lg shadow-gold-500/20">
              <Scan className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-xl tracking-tight text-sand-50">
                  Veri<span className="text-gold-400">Lens</span>
                </span>
              </div>
              <p className="hidden 2xl:block text-[11px] text-sand-400 font-medium tracking-wide whitespace-nowrap">
                “Don’t just ask if it’s real. <span className="text-gold-400 font-semibold">See why.</span>”
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-sand-900/90 p-1 rounded-xl border border-sand-800">
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'media'
                  ? 'bg-gradient-to-r from-navy-600 to-navy-600 text-white shadow-md shadow-gold-900/40'
                  : 'text-sand-400 hover:text-sand-200 hover:bg-sand-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Media Trust Report</span>
            </button>

            <button
              onClick={() => setActiveTab('liveness')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'liveness'
                  ? 'bg-gradient-to-r from-navy-600 to-navy-600 text-white shadow-md shadow-gold-900/40'
                  : 'text-sand-400 hover:text-sand-200 hover:bg-sand-800/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Identity Check</span>
            </button>

            <button
              onClick={() => setActiveTab('zk')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'zk'
                  ? 'bg-gradient-to-r from-navy-600 to-navy-600 text-white shadow-md shadow-gold-900/40'
                  : 'text-sand-400 hover:text-sand-200 hover:bg-sand-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>ZK Privacy</span>
            </button>

            <button
              onClick={() => setActiveTab('philosophy')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'philosophy'
                  ? 'bg-gradient-to-r from-navy-600 to-navy-600 text-white shadow-md shadow-gold-900/40'
                  : 'text-sand-400 hover:text-sand-200 hover:bg-sand-800/60'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Evidence Philosophy</span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === 'roadmap'
                  ? 'bg-gradient-to-r from-navy-600 to-navy-600 text-white shadow-md shadow-gold-900/40'
                  : 'text-sand-400 hover:text-sand-200 hover:bg-sand-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Future Roadmap</span>
            </button>
          </nav>

          {/* Right Actions: API Key */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* API Key Config Button */}
            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition ${
                hasApiKey 
                  ? 'border-olive-500/40 bg-olive-950/30 text-olive-300 hover:bg-olive-900/40' 
                  : 'border-sand-700 bg-sand-900 text-sand-300 hover:border-gold-500/60 hover:text-gold-300'
              }`}
              title="Configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {hasApiKey ? 'Gemini Key Configured' : 'Add Gemini Key'}
              </span>
              <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-olive-400 animate-pulse' : 'bg-gold-400'}`} />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center justify-between pb-3 pt-1 border-t border-sand-800/60">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === 'media' ? 'bg-navy-600 text-white' : 'text-sand-400'
              }`}
            >
              Media Report
            </button>
            <button
              onClick={() => setActiveTab('liveness')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === 'liveness' ? 'bg-navy-600 text-white' : 'text-sand-400'
              }`}
            >
              Live Check
            </button>
            <button
              onClick={() => setActiveTab('zk')}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                activeTab === 'zk' ? 'bg-navy-600 text-white' : 'text-sand-400'
              }`}
            >
              ZK Privacy
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('philosophy')}
              className={`text-xs flex items-center space-x-1 ${activeTab === 'philosophy' ? 'text-sand-50' : 'text-gold-400'}`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Philosophy</span>
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`text-xs flex items-center space-x-1 ${activeTab === 'roadmap' ? 'text-sand-50' : 'text-gold-400'}`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Roadmap</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
