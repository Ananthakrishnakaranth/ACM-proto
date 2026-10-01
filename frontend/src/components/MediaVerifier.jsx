import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Layers, 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  Info, 
  ExternalLink, 
  ChevronRight, 
  Eye, 
  Camera, 
  Download, 
  MessageSquare,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  Bot,
  Cpu,
  Zap,
  Fingerprint
} from 'lucide-react';
import ImageAnnotator from './ImageAnnotator';

export default function MediaVerifier({ 
  apiKey, 
  onOpenChat, 
  samples = [],
  currentReport,
  setCurrentReport,
  activeImageSrc,
  setActiveImageSrc
}) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'exif' | 'next_steps'
  const [activeFindingId, setActiveFindingId] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const fileInputRef = useRef(null);

  const toggleCheck = (idx) => {
    setCheckedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Show image preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setActiveImageSrc(e.target.result);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    setCurrentReport(null);
    setActiveFindingId(null);
    setCheckedSteps({});

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (apiKey) {
        formData.append('api_key', apiKey);
      }

      const response = await fetch('/api/analyze-media', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setCurrentReport({
        filename: data.filename || file.name,
        metadata: data.metadata,
        ...data.report
      });
    } catch (err) {
      console.warn('API call failed or backend offline.', err);
      // Backend unreachable: do not fabricate a verdict, report that no analysis ran
      setCurrentReport({
        filename: file.name,
        metadata: {
          filename: file.name,
          file_size_kb: Math.round(file.size / 1024),
          mime_type: file.type,
          has_exif: false,
          forensic_flags: []
        },
        summary: "The VeriLens analysis server could not be reached, so this image was not analyzed. Start the backend and try again.",
        verdict_category: "Inconclusive / Analysis Unavailable",
        confidence: "Low",
        confidence_explanation: `No analysis was performed (${err.message}).`,
        findings: [],
        metadata_analysis: {
          camera_info: "Not analyzed",
          software_detected: "Not analyzed",
          timestamp: "Not analyzed",
          risk_assessment: "Not analyzed"
        },
        what_to_check_next: [
          "Make sure the backend is running (python main.py in the backend folder).",
          "Re-upload the image once the server is available."
        ],
        disclaimer: "VeriLens provides evidence and reasoning signals, not absolute proof of authenticity."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample) => {
    setActiveImageSrc(sample.thumbnail);
    setCurrentReport({
      filename: sample.metadata?.filename || sample.id,
      metadata: sample.metadata,
      ...sample.report
    });
    setActiveFindingId(null);
    setCheckedSteps({});
  };

  const getVerdictBadge = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('possibly')) {
      return {
        bg: 'bg-amber-950/80',
        text: 'text-amber-300',
        border: 'border-amber-800',
        icon: AlertTriangle,
        glow: 'glow-amber'
      };
    }
    if (cat.includes('synthetic') || cat.includes('generated')) {
      return {
        bg: 'bg-rose-950/80',
        text: 'text-rose-300',
        border: 'border-rose-800',
        icon: ShieldAlert,
        glow: 'glow-rose'
      };
    }
    if (cat.includes('manipulation') || cat.includes('inpainting')) {
      return {
        bg: 'bg-amber-950/80',
        text: 'text-amber-300',
        border: 'border-amber-800',
        icon: AlertTriangle,
        glow: 'glow-amber'
      };
    }
    if (cat.includes('authentic') || cat.includes('unmodified')) {
      return {
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-300',
        border: 'border-emerald-800',
        icon: ShieldCheck,
        glow: 'glow-emerald'
      };
    }
    return {
      bg: 'bg-slate-800',
      text: 'text-slate-300',
      border: 'border-slate-700',
      icon: Info,
      glow: ''
    };
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReport = () => {
    if (!currentReport) return;
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `verilens-report-${Date.now()}.json`);
  };

  // Sample presets use a URL path; uploads are already data URLs
  const toDataUrl = async (src) => {
    if (!src || src.startsWith('data:')) return src || null;
    const blob = await (await fetch(src)).blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  };

  const exportPdfReport = async () => {
    if (!currentReport || pdfLoading) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const response = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: currentReport, image_data_url: await toDataUrl(activeImageSrc) })
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const disposition = response.headers.get('Content-Disposition') || '';
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `VeriLens_Report_${Date.now()}.pdf`;
      downloadBlob(await response.blob(), filename);
    } catch (err) {
      console.warn('PDF report generation failed.', err);
      setPdfError('Could not generate the PDF report. Is the backend running?');
    } finally {
      setPdfLoading(false);
    }
  };

  const verdictStyles = getVerdictBadge(currentReport?.verdict_category);
  const VerdictIcon = verdictStyles.icon;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Sample Preset Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Media Trust Report</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Extract EXIF telemetry and inspect visual characteristics with Gemini Multimodal reasoning.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick Demos:
          </span>
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSample(s)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:border-cyan-500/60 transition flex items-center space-x-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{s.title.split('(')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Upload & Inspection Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Image & Focal Viewer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className="group cursor-pointer p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-950/60 hover:bg-slate-900/60 transition-all duration-200 text-center flex flex-col items-center justify-center space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 group-hover:scale-110 transition shadow-lg shadow-cyan-950/40">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Drop your image here, or <span className="text-cyan-400">browse files</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports JPG, PNG, WEBP, TIFF (Retains EXIF tags)
              </p>
            </div>
          </div>

          {/* Image & Interactive Focal Annotator */}
          {activeImageSrc && (
            <ImageAnnotator
              imageSrc={activeImageSrc}
              findings={currentReport?.findings || []}
              activeFindingId={activeFindingId}
              onSelectFinding={(id) => {
                setActiveFindingId(id);
                setActiveTab('findings');
              }}
            />
          )}

          {/* Quick File Specs Pill */}
          {currentReport?.metadata && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div>
                <span className="text-slate-500 block">Format</span>
                <span className="text-slate-200 font-semibold">{currentReport.metadata.format}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Resolution</span>
                <span className="text-slate-200 font-semibold">
                  {currentReport.metadata.dimensions?.width}x{currentReport.metadata.dimensions?.height}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Size</span>
                <span className="text-slate-200 font-semibold">{currentReport.metadata.file_size_kb} KB</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hardware EXIF</span>
                <span className={currentReport.metadata.has_exif ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                  {currentReport.metadata.has_exif ? "Detected" : "None"}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Structured Trust Report (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {loading ? (
            <div className="min-h-[480px] rounded-2xl glass-panel border border-cyan-800/40 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-sky-500/20 border-b-sky-400 animate-spin" style={{ animationDirection: 'reverse' }} />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-cyan-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Synthesizing Multimodal Evidence</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Extracting EXIF maker notes, inspecting corneal catchlights, and running Gemini reasoning models...
                </p>
              </div>
            </div>
          ) : currentReport ? (
            <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-2xl space-y-5 p-5 sm:p-6">
              
              {/* Report Header: Verdict & Confidence */}
              <div className="space-y-3 pb-4 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${verdictStyles.bg} ${verdictStyles.text} ${verdictStyles.border} ${verdictStyles.glow}`}>
                      <VerdictIcon className="w-4 h-4" />
                      <span>{currentReport.verdict_category}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-900 text-slate-300 border border-slate-700">
                      Confidence: <strong className="text-white">{currentReport.confidence}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={onOpenChat}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/40 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask VeriLens</span>
                    </button>

                    <button
                      onClick={exportPdfReport}
                      disabled={pdfLoading}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-600 transition disabled:opacity-60 disabled:cursor-wait"
                      title="Download a PDF report of this analysis"
                    >
                      {pdfLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      <span>{pdfLoading ? 'Generating...' : 'PDF Report'}</span>
                    </button>

                    <button
                      onClick={exportReport}
                      className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition"
                      title="Export raw JSON data"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {pdfError && (
                  <p className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-lg px-2.5 py-1.5">
                    {pdfError}
                  </p>
                )}

                {/* Executive Summary */}
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {currentReport.summary}
                </p>

                {currentReport.confidence_explanation && (
                  <p className="text-xs text-slate-400 italic">
                    Why {currentReport.confidence.toLowerCase()} confidence: {currentReport.confidence_explanation}
                  </p>
                )}

                {currentReport.api_notice && (
                  <p className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-900/60 rounded-lg px-2.5 py-1.5">
                    {currentReport.api_notice}
                  </p>
                )}
              </div>

              {/* Dedicated AI Generation & Synthetic Media Assessment Card */}
              {currentReport.ai_assessment && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-cyan-800/50 shadow-lg space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-mono text-cyan-400 font-bold block">
                          AI Generation & Synthetic Model Analysis
                        </span>
                        <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                          <span>{currentReport.ai_assessment.is_ai_generated || "AI Forensic Classification"}</span>
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        (currentReport.ai_assessment.ai_likelihood || '').toLowerCase().includes('high')
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : (currentReport.ai_assessment.ai_likelihood || '').toLowerCase().includes('moderate') || (currentReport.ai_assessment.ai_likelihood || '').toLowerCase().includes('medium')
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : (currentReport.ai_assessment.ai_likelihood || '').toLowerCase().includes('unknown')
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        AI Likelihood: {currentReport.ai_assessment.ai_likelihood}
                      </span>
                      {currentReport.ai_assessment.confidence_score && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                          {currentReport.ai_assessment.confidence_score}
                        </span>
                      )}
                    </div>
                  </div>

                  {currentReport.ai_assessment.suspected_generator && (
                    <div className="text-xs text-slate-300 flex items-center space-x-1.5 font-medium">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span><strong>Suspected Pipeline:</strong> {currentReport.ai_assessment.suspected_generator}</span>
                    </div>
                  )}

                  {currentReport.probability_breakdown?.length > 0 && (
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-2 space-y-0.5">
                      <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 font-sans">How the AI probability was calculated</span>
                      {currentReport.probability_breakdown.map((step, i) => (
                        <div key={i} className={i === currentReport.probability_breakdown.length - 1 ? 'text-slate-200 font-semibold' : ''}>{step}</div>
                      ))}
                    </div>
                  )}

                  {currentReport.ai_assessment.key_signatures?.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Detected Generator & Synthesis Signatures:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentReport.ai_assessment.key_signatures.map((sig, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-950 border border-slate-700/80 text-cyan-300 flex items-center space-x-1"
                          >
                            <Zap className="w-3 h-3 text-cyan-400" />
                            <span>{sig}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Editing Analysis: was the photo changed after capture? */}
              {currentReport.edit_analysis && (() => {
                const edit = currentReport.edit_analysis;
                const tone = {
                  red: 'bg-rose-950 text-rose-300 border-rose-800',
                  amber: 'bg-amber-950 text-amber-300 border-amber-800',
                  green: 'bg-emerald-950 text-emerald-300 border-emerald-800',
                  grey: 'bg-slate-800 text-slate-300 border-slate-700'
                }[edit.tone] || 'bg-slate-800 text-slate-300 border-slate-700';
                const strengthStyle = {
                  strong: 'text-rose-300 border-rose-900/70',
                  moderate: 'text-amber-300 border-amber-900/70',
                  weak: 'text-sky-300 border-sky-900/70',
                  info: 'text-slate-400 border-slate-800'
                };
                return (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 shadow-lg space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-slate-950 text-amber-300 border border-slate-700">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-mono text-amber-300 font-bold block">
                            Editing & Manipulation Analysis
                          </span>
                          <h4 className="text-sm font-bold text-white">Was this photo edited after capture?</h4>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${tone}`}>{edit.verdict}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                          {edit.edit_probability}% edit likelihood
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">{edit.summary}</p>

                    {edit.edit_types?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {edit.edit_types.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-amber-950/50 border border-amber-900/60 text-amber-200">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {edit.signals?.map((s, i) => (
                        <div key={i} className={`text-[11px] border-l-2 pl-2.5 py-0.5 ${strengthStyle[s.strength] || strengthStyle.info}`}>
                          <span className="font-semibold">{s.title}</span>
                          <span className="ml-1.5 text-[9px] uppercase font-mono opacity-70">{s.source} · {s.strength}</span>
                          <p className="text-slate-400">{s.detail}</p>
                        </div>
                      ))}
                    </div>

                    {edit.note && <p className="text-[11px] text-slate-500 italic">{edit.note}</p>}

                    {edit.ela_heatmap && (
                      <details className="group">
                        <summary className="text-[11px] font-semibold text-cyan-300 cursor-pointer select-none">
                          Show Error Level Analysis (ELA) heatmap
                        </summary>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeImageSrc && <img src={activeImageSrc} alt="Original" className="w-full rounded-lg border border-slate-800" />}
                          <img src={edit.ela_heatmap} alt="ELA heatmap" className="w-full rounded-lg border border-slate-800" />
                        </div>
                        <p className="mt-1.5 text-[10px] text-slate-500">
                          ELA re-compresses the image and shows how much each area changes. Edges and fine texture are naturally bright.
                          Look for a region that is clearly brighter or darker than similar areas around it - a sign it was pasted or retouched.
                        </p>
                      </details>
                    )}
                  </div>
                );
              })()}

              {/* Sub-Tabs: What We Found | EXIF Metadata | What To Check Next */}
              <div className="flex border-b border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('findings')}
                  className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
                    activeTab === 'findings'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  What We Found & Why Suspicious ({currentReport.findings?.length || 0})
                </button>

                <button
                  onClick={() => setActiveTab('exif')}
                  className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
                    activeTab === 'exif'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  EXIF & Camera Telemetry
                </button>

                <button
                  onClick={() => setActiveTab('next_steps')}
                  className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
                    activeTab === 'next_steps'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  What To Check Next ({currentReport.what_to_check_next?.length || 0})
                </button>
              </div>

              {/* TAB 1: Evidence Findings */}
              {activeTab === 'findings' && (
                <div className="space-y-3">
                  {currentReport.findings?.map((f) => {
                    const isSelected = activeFindingId === f.id;
                    const isHigh = f.suspicion_level === 'high';
                    const isMed = f.suspicion_level === 'medium';

                    return (
                      <div
                        key={f.id}
                        onClick={() => setActiveFindingId(isSelected ? null : f.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-white">{f.label}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900 text-slate-400 border border-slate-800">
                              {f.category}
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isHigh
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isMed
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}>
                            {f.suspicion_level} Suspicion
                          </span>
                        </div>

                        {/* What we found */}
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wide">
                              What we found:
                            </span>
                            <p className="text-slate-200 mt-0.5">{f.what_we_found}</p>
                          </div>

                          {/* Why it's suspicious - The core differentiator! */}
                          <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40">
                            <span className="text-cyan-300 font-bold block text-[11px] uppercase tracking-wide flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              <span>Why It’s Suspicious:</span>
                            </span>
                            <p className="text-slate-300 mt-1 leading-relaxed">{f.why_suspicious}</p>
                          </div>
                        </div>

                        {f.box_2d && (
                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-cyan-400 font-mono">
                            <span>Focal Zone: [{f.box_2d.join(', ')}]</span>
                            <span className="text-[10px] text-slate-400">Click to focus on image HUD</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: EXIF & Telemetry */}
              {activeTab === 'exif' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wide text-cyan-400">
                      Camera & Sensor Telemetry
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Camera Hardware:</span>
                        <span className="font-semibold text-white">
                          {currentReport.metadata?.camera_make || 'No hardware record'} {currentReport.metadata?.camera_model || ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Software Used:</span>
                        <span className="font-semibold text-white">
                          {currentReport.metadata?.software || 'None detected'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Capture Date/Time:</span>
                        <span className="font-mono text-slate-200">
                          {currentReport.metadata?.date_time_original || 'Not stamped'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Lens & Exposure:</span>
                        <span className="text-slate-200">
                          {currentReport.metadata?.lens_model || 'N/A'} {currentReport.metadata?.exposure_time ? `(${currentReport.metadata.exposure_time}, ${currentReport.metadata.f_number})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Forensic Heuristic Flags from EXIF */}
                  {currentReport.metadata?.forensic_flags?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">
                        Metadata Heuristic Flags ({currentReport.metadata.forensic_flags.length})
                      </h4>
                      {currentReport.metadata.forensic_flags.map((flag, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950 border border-amber-900/40 text-xs space-y-1"
                        >
                          <div className="flex items-center space-x-2 text-amber-400 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{flag.title}</span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{flag.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Raw tags preview */}
                  {currentReport.metadata?.raw_exif_tags && Object.keys(currentReport.metadata.raw_exif_tags).length > 0 && (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold block mb-2">Raw EXIF Fields</span>
                      <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-400">
                        {Object.entries(currentReport.metadata.raw_exif_tags).slice(0, 15).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-slate-900 pb-0.5">
                            <span className="text-slate-500">{k}</span>
                            <span className="text-slate-300 truncate max-w-[200px]">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: What To Check Next */}
              {activeTab === 'next_steps' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>Actionable Digital Verification:</strong> Rather than trusting an automated verdict, follow these practical human verification steps.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {currentReport.what_to_check_next?.map((step, idx) => {
                      const isDone = !!checkedSteps[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleCheck(idx)}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start space-x-3 text-xs ${
                            isDone 
                              ? 'bg-slate-950/40 border-slate-800 text-slate-500 line-through' 
                              : 'bg-slate-950/80 border-slate-800 hover:border-cyan-700/60 text-slate-200'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Disclaimer Notice */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <p>
                  <strong className="text-slate-300">Evidence, Not Verdicts:</strong> {currentReport.disclaimer || "VeriLens provides evidence and reasoning signals, not absolute proof of authenticity."}
                </p>
              </div>

            </div>
          ) : (
            <div className="min-h-[460px] rounded-2xl glass-panel border border-slate-800/80 p-8 flex flex-col items-center justify-center text-center space-y-3">
              <Camera className="w-12 h-12 text-slate-600" />
              <h3 className="text-base font-bold text-slate-300">No Image Loaded</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Upload a suspected synthetic or edited portrait, or select one of the Quick Demo presets above to generate a complete Trust Report.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
