import React from 'react';
import { 
  X, 
  Eye, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Hand, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function PhilosophyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 p-6 sm:p-8 bg-slate-900 border border-cyan-800/60 rounded-3xl shadow-2xl text-slate-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Core Design Philosophy — Trust in a Synthetic World</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          “Don’t just ask if it’s real. <span className="bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">See why.</span>”
        </h2>

        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          In a world saturated with generative diffusion models and real-time neural face-swaps, binary scores like <span className="text-rose-400 font-mono font-semibold">“Fake: 87%”</span> fail users. They erode nuanced digital literacy, create false confidence, and offer zero actionable paths to truth.
        </p>

        {/* Contrast Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>The Flawed Paradigm</span>
            </div>
            <p className="text-xs text-slate-300">
              Black-box AI gives an opaque binary probability without explanation. If a camera photo is compressed or an AI face is flawless, the user has no way to evaluate the claim or take next steps.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-700/50">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>VeriLens Paradigm</span>
            </div>
            <p className="text-xs text-slate-300">
              <strong>Evidence, not verdicts.</strong> We inspect optical specular highlights, compression boundaries, and sensor telemetry, explaining the exact physical reasoning behind every flag.
            </p>
          </div>
        </div>

        {/* The 4 Pillars */}
        <div className="mt-6 space-y-3">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
            The 4-Step VeriLens Trust Structure
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="font-bold text-cyan-400">1. What we found:</span>
              <p className="text-slate-400 mt-1">Specific objective observations (e.g. mismatched pupil reflections, stripped EXIF).</p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="font-bold text-cyan-400">2. Why it’s suspicious:</span>
              <p className="text-slate-400 mt-1">Forensic science behind why AI or editing tools fail at this physical characteristic.</p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="font-bold text-cyan-400">3. How confident:</span>
              <p className="text-slate-400 mt-1">Transparent certainty level backed by the quantity and consistency of evidence.</p>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="font-bold text-cyan-400">4. What to check next:</span>
              <p className="text-slate-400 mt-1">Concrete, human-executable steps (reverse search, 400% zoom check, C2PA check).</p>
            </div>
          </div>
        </div>

        {/* Occlusion Insight */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/40">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider mb-1">
            <Hand className="w-4 h-4 text-cyan-400" />
            <span>Why The Hand-Over-Face Occlusion Challenge Works</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Real-time face-swap engines (e.g. DeepFaceLive) rely on continuous facial landmark mesh tracking. When a user introduces a hand or fingers across their mouth and nose, the neural blend algorithm frequently collapses: texture bleeds over the knuckles, edges jitter, or the synthetic face abruptly drops. Gemini multimodal vision evaluates this boundary moment.
          </p>
        </div>

        {/* Gemini's Role */}
        <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start space-x-3">
          <Cpu className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-200">Gemini's Role:</strong> Gemini acts strictly as the <span className="text-cyan-300">Reasoning and Explanation Layer</span>. It sees images and occlusion frames, correlates EXIF and visual signals, and explains findings. It does <em>not prove authenticity</em>, but empowers humans to verify.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition"
          >
            Understood — Explore VeriLens
          </button>
        </div>

      </div>
    </div>
  );
}
