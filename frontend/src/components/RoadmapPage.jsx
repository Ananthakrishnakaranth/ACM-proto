import React from 'react';
import {
  Compass,
  MessageCircle,
  Globe,
  Smartphone,
  Video,
  FileCheck,
  ShieldAlert,
  CheckCircle2,
  Image as ImageIcon,
  ScanFace,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

const SHIPPED = [
  { title: 'Media Trust Report', icon: ImageIcon, tab: 'media' },
  { title: 'Live Identity Check', icon: ScanFace, tab: 'liveness' },
  { title: 'Ask VeriLens Chat', icon: MessageSquare, tab: 'media' },
  { title: 'ZK Privacy Studio', icon: ShieldCheck, tab: 'zk' }
];

// Full class strings so Tailwind can detect them at build time
const COLORS = {
  emerald: 'text-olive-400 border-olive-800/60 bg-olive-950/40',
  cyan: 'text-olive-400 border-olive-800/60 bg-olive-950/40',
  sky: 'text-olive-400 border-olive-800/60 bg-olive-950/40',
  indigo: 'text-olive-300 border-olive-800/60 bg-olive-950/40',
  amber: 'text-olive-400 border-olive-800/60 bg-olive-950/40',
  rose: 'text-burgundy-400 border-burgundy-800/60 bg-burgundy-950/40'
};

const PHASES = [
  {
    phase: 'Phase 2',
    name: 'Consumer Trust',
    summary: 'Bring verification to where fakes actually spread.',
    items: [
      {
        title: 'WhatsApp Verification Bot',
        icon: MessageCircle,
        color: 'emerald',
        description: 'Forward suspicious images, viral forwards, or documents directly to the VeriLens WhatsApp Bot to receive an instant, plain-English Trust Report before sharing.'
      },
      {
        title: 'In-Situ Browser Extension',
        icon: Globe,
        color: 'cyan',
        description: 'Right-click any image or profile photo on X (Twitter), LinkedIn, Instagram, or Reddit for instant inline EXIF telemetry and corneal catchlight analysis.'
      }
    ]
  },
  {
    phase: 'Phase 3',
    name: 'Capture & Video',
    summary: 'Prove authenticity at the shutter and extend analysis to video.',
    items: [
      {
        title: 'Native Mobile App (iOS & Android)',
        icon: Smartphone,
        color: 'sky',
        description: 'Hardware-level provenance capture leveraging Apple Secure Enclave & Android KeyStore to cryptographically prove photo authenticity directly at the camera shutter.'
      },
      {
        title: 'Temporal Video Deepfake Detection',
        icon: Video,
        color: 'indigo',
        description: 'Frame-by-frame 3D temporal tracking measuring blink rate variances, phoneme/viseme audio-visual lip desynchronization, and head pose parallax tearing.'
      }
    ]
  },
  {
    phase: 'Phase 4',
    name: 'Identity & Fraud Defense',
    summary: 'Plug into national identity rails and stop social-engineering scams.',
    items: [
      {
        title: 'DigiLocker & Document Cryptography',
        icon: FileCheck,
        color: 'amber',
        description: 'Direct verification with national digital identity infrastructure (DigiLocker / Aadhaar XML) to authenticate certificates, tax records, and ID credentials.'
      },
      {
        title: 'Phishing & Voice Clone Defense',
        icon: ShieldAlert,
        color: 'rose',
        description: 'Multimodal defense analyzing AI voice clones used in emergency family scams, synthetic CEO fraud, and deepfake video call injection attacks.'
      }
    ]
  }
];

export default function RoadmapPage({ setActiveTab }) {
  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl glass-panel border border-sand-800">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-olive-950/80 border border-olive-700/60 text-olive-300 text-xs font-semibold mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>Product Evolution — Beyond the MVP</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-semibold text-sand-50">
          VeriLens <span className="bg-gradient-to-r from-olive-400 to-olive-300 bg-clip-text text-transparent">Future Roadmap</span>
        </h2>

        <p className="mt-2 text-sm text-sand-300 leading-relaxed max-w-5xl">
          Our hackathon MVP proves the core idea — explainable evidence instead of black-box verdicts. Here is how we scale synthetic media defense across everyday digital life.
        </p>
      </div>

      {/* Phase 1: Shipped */}
      <section className="p-5 rounded-2xl glass-panel border border-olive-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-olive-400">Phase 1 — Shipped in this MVP</p>
            <p className="text-xs text-sand-400 mt-0.5">Live now in this demo. Click any module to try it.</p>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-olive-950/60 border border-olive-800/60 text-olive-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete</span>
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SHIPPED.map(({ title, icon: Icon, tab }) => (
            <button
              key={title}
              onClick={() => setActiveTab(tab)}
              className="flex items-center space-x-2.5 p-3 rounded-xl bg-sand-950/70 border border-sand-800 hover:border-olive-700/60 text-left transition group"
            >
              <Icon className="w-4 h-4 text-olive-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-sand-200 group-hover:text-olive-300 transition">{title}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Phases 2–4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {PHASES.map(({ phase, name, summary, items }) => (
          <section key={phase} className="p-5 rounded-2xl glass-panel border border-sand-800 flex flex-col space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-olive-400">{phase} — {name}</p>
              <p className="text-xs text-sand-400 mt-0.5">{summary}</p>
            </div>

            {items.map(({ title, icon: Icon, color, description }) => (
              <div
                key={title}
                className="flex-1 p-4 rounded-2xl bg-sand-950/70 border border-sand-800 hover:border-olive-700/60 transition group"
              >
                <div className="flex items-center space-x-2.5 mb-2">
                  <div className={`p-2 rounded-xl border ${COLORS[color]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-sand-50 group-hover:text-olive-300 transition">{title}</span>
                </div>
                <p className="text-xs text-sand-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
