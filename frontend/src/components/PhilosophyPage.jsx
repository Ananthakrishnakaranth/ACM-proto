import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Hand,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  ScanFace,
  MessageSquare,
  ShieldCheck,
  Layers,
  HelpCircle
} from 'lucide-react';

const MODULES = [
  {
    icon: ImageIcon,
    title: 'Media Trust Report',
    color: 'text-gold-400',
    tab: 'media',
    body: 'Upload an image (or pick a sample). VeriLens extracts EXIF & camera telemetry, then Gemini inspects catchlights, skin texture, hair edges and perspective — returning findings with highlighted regions on the image.'
  },
  {
    icon: ScanFace,
    title: 'Live Identity Check',
    color: 'text-gold-400',
    tab: 'liveness',
    body: 'A 4-step webcam challenge — face front, turn left, turn right, hand over face — that exposes real-time face-swaps. Includes a simulation mode for machines without a camera.'
  },
  {
    icon: MessageSquare,
    title: 'Ask VeriLens',
    color: 'text-gold-300',
    tab: 'media',
    body: 'A contextual chat that answers follow-up questions about any report — e.g. “Could this just be compression?” — always explaining evidence rather than issuing verdicts.'
  },
  {
    icon: ShieldCheck,
    title: 'Zero-Knowledge Privacy Studio',
    color: 'text-gold-400',
    tab: 'zk',
    body: 'Turns a passed check into a shareable proof: frames and documents are hashed into commitments and discarded, so you can prove liveness without handing over your face. A PIN authenticator covers no-camera devices.'
  }
];

const PIPELINE = ['Image / Webcam', 'EXIF + Frame Capture', 'Gemini Reasoning', 'Trust Report', 'ZK Proof'];

const STACK = ['React 19', 'Vite', 'Tailwind CSS v4', 'FastAPI', 'Python 3.12', 'Pillow + ExifRead', 'Google Gemini', 'getUserMedia / Canvas'];

const TRUST_STEPS = [
  ['What we found', 'Objective observations (mismatched pupil reflections, stripped EXIF).'],
  ['Why it’s suspicious', 'The forensic science behind why AI or editing tools fail here.'],
  ['How confident', 'Certainty backed by the quantity and consistency of evidence.'],
  ['What to check next', 'Human steps: reverse search, 400% zoom, C2PA check.']
];

export default function PhilosophyPage({ setActiveTab }) {
  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-2xl glass-panel border border-sand-800">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold-950/80 border border-gold-700/60 text-gold-300 text-xs font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Evidence Philosophy — Trust in a Synthetic World</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-semibold text-sand-50">
          “Don’t just ask if it’s real. <span className="bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-transparent">See why.</span>”
        </h2>

        <p className="mt-2 text-sm text-sand-300 leading-relaxed max-w-5xl">
          VeriLens is an AI-powered media and identity verification platform. Instead of opaque scores like <span className="text-maroon-400 font-mono font-semibold">“Fake: 87%”</span>, it combines camera metadata, optical physics, webcam liveness challenges and Google Gemini’s multimodal reasoning to produce an explainable <strong className="text-gold-300">Trust Report</strong> — evidence a human can check, not a verdict to blindly accept.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Project Summary */}
        <section className="lg:col-span-7 p-5 rounded-2xl glass-panel border border-sand-800 space-y-4">
          <h3 className="flex items-center space-x-2 text-xs uppercase tracking-wider font-bold text-sand-400">
            <Layers className="w-4 h-4 text-gold-400" />
            <span>Project Summary — What VeriLens Does</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULES.map(({ icon: Icon, title, color, tab, body }) => (
              <button
                key={title}
                onClick={() => setActiveTab(tab)}
                className="text-left p-4 bg-sand-950/70 border border-sand-800 hover:border-gold-700/60 rounded-2xl transition group"
              >
                <div className={`flex items-center space-x-2 font-bold text-sm mb-1.5 ${color}`}>
                  <Icon className="w-4 h-4" />
                  <span>{title}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-sand-600 group-hover:text-gold-400 transition" />
                </div>
                <p className="text-xs text-sand-400 leading-relaxed">{body}</p>
              </button>
            ))}
          </div>

          <div className="p-4 bg-sand-950/50 border border-sand-800 rounded-2xl">
            <p className="text-xs uppercase tracking-wider font-bold text-sand-400 mb-3">How It Works</p>
            <div className="flex flex-wrap items-center gap-2">
              {PIPELINE.map((step, i) => (
                <React.Fragment key={step}>
                  <span className="px-2.5 py-1 rounded-lg bg-gold-950/50 border border-gold-800/50 text-gold-200 text-xs font-medium">
                    {step}
                  </span>
                  {i < PIPELINE.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-sand-500" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="p-4 bg-sand-950/50 border border-sand-800 rounded-2xl">
            <p className="text-xs uppercase tracking-wider font-bold text-sand-400 mb-3">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {STACK.map((tech) => (
                <span key={tech} className="px-2.5 py-1 rounded-full bg-sand-800 border border-sand-700 text-sand-300 text-xs">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Philosophy */}
        <section className="lg:col-span-5 p-5 rounded-2xl glass-panel border border-sand-800 space-y-4">
          <h3 className="flex items-center space-x-2 text-xs uppercase tracking-wider font-bold text-sand-400">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>Core Philosophy — Evidence, Not Verdicts</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-maroon-950/20 border border-maroon-900/40">
              <div className="flex items-center space-x-2 text-maroon-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Flawed Paradigm</span>
              </div>
              <p className="text-xs text-sand-300 leading-relaxed">
                Black-box AI gives an unexplained probability. Users can’t evaluate the claim or know what to do next.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-gold-950/30 border border-gold-700/50">
              <div className="flex items-center space-x-2 text-gold-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>VeriLens Paradigm</span>
              </div>
              <p className="text-xs text-sand-300 leading-relaxed">
                Every flag comes with the physical reasoning behind it — highlights, compression, sensor telemetry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {TRUST_STEPS.map(([title, body], i) => (
              <div key={title} className="p-3 bg-sand-950/70 border border-sand-800 rounded-xl">
                <span className="font-bold text-gold-400">{i + 1}. {title}</span>
                <p className="text-sand-400 mt-1 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-gold-950/40 to-sand-900 border border-gold-800/40">
            <div className="flex items-center space-x-2 text-gold-300 font-bold text-xs uppercase tracking-wider mb-1">
              <Hand className="w-4 h-4 text-gold-400" />
              <span>Why Hand-Over-Face Works</span>
            </div>
            <p className="text-xs text-sand-300 leading-relaxed">
              Real-time face-swaps (e.g. DeepFaceLive) track facial landmarks continuously. A hand across the mouth and nose breaks that tracking — texture bleeds over knuckles, edges jitter, or the fake face drops.
            </p>
          </div>

          <div className="p-3 bg-sand-950/60 border border-sand-800 rounded-xl text-xs text-sand-400 flex items-start space-x-3">
            <Cpu className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-sand-200">Gemini’s Role:</strong> the <span className="text-gold-300">Reasoning and Explanation Layer</span>. It correlates visual and EXIF signals and explains findings. It does <em>not prove authenticity</em> — it empowers humans to verify.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
