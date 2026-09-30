import React from 'react';
import { 
  X, 
  Compass, 
  MessageCircle, 
  Globe, 
  Smartphone, 
  Video, 
  FileCheck, 
  ShieldAlert, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const ROADMAP_ITEMS = [
  {
    id: 'whatsapp_bot',
    title: 'WhatsApp Verification Bot',
    badge: 'Phase 2: Viral Consumer Trust',
    icon: MessageCircle,
    color: 'emerald',
    description: 'Forward suspicious images, viral forwards, or documents directly to the VeriLens WhatsApp Bot to receive an instant, plain-English Trust Report before sharing.'
  },
  {
    id: 'browser_ext',
    title: 'In-Situ Browser Extension',
    badge: 'Phase 2: Social Shield',
    icon: Globe,
    color: 'cyan',
    description: 'Right-click any image or profile photo on X (Twitter), LinkedIn, Instagram, or Reddit for instant inline EXIF telemetry and corneal catchlight analysis.'
  },
  {
    id: 'mobile_app',
    title: 'Native Mobile App (iOS & Android)',
    badge: 'Phase 3: Sensor Attestation',
    icon: Smartphone,
    color: 'sky',
    description: 'Hardware-level provenance capture leveraging Apple Secure Enclave & Android KeyStore to cryptographically prove photo authenticity directly at the camera shutter.'
  },
  {
    id: 'video_deepfake',
    title: 'Temporal Video Deepfake Detection',
    badge: 'Phase 3: Video AI',
    icon: Video,
    color: 'indigo',
    description: 'Frame-by-frame 3D temporal tracking measuring blink rate variances, phoneme/viseme audio-visual lip desynchronization, and head pose parallax tearing.'
  },
  {
    id: 'digilocker',
    title: 'DigiLocker & Document Cryptography',
    badge: 'Phase 4: Identity & KYC',
    icon: FileCheck,
    color: 'amber',
    description: 'Direct verification with national digital identity infrastructure (DigiLocker / Aadhaar XML) to authenticate certificates, tax records, and ID credentials.'
  },
  {
    id: 'scam_shield',
    title: 'Phishing & Voice Clone Defense',
    badge: 'Phase 4: Social Engineering',
    icon: ShieldAlert,
    color: 'rose',
    description: 'Multimodal defense analyzing AI voice clones used in emergency family scams, synthetic CEO fraud, and deepfake video call injection attacks.'
  }
];

export default function RoadmapModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 p-6 sm:p-8 bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold mb-4">
          <Compass className="w-3.5 h-3.5" />
          <span>Product Evolution — Beyond the MVP</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          VeriLens <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">Future Roadmap</span>
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          While our hackathon MVP focuses strictly on <strong>Media Trust Reports</strong> and <strong>Live Occlusion Identity Checks</strong>, here is our tactical roadmap to scale synthetic media defense across everyday digital life:
        </p>

        {/* Roadmap Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
          {ROADMAP_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-700/60 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 group-hover:scale-105 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                      {item.title}
                    </span>
                  </div>
                </div>

                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  {item.badge}
                </span>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Priority: Media Trust & Live Occlusion MVP (6hr Sprint)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-semibold rounded-xl shadow-md transition"
          >
            Back to Application
          </button>
        </div>

      </div>
    </div>
  );
}
