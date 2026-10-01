import React, { useRef, useState } from 'react';
import { Film, Upload, Sparkles, ShieldAlert, ShieldCheck, AlertTriangle, Info, Bot, Sliders, Clock, Download, FileText } from 'lucide-react';

const VERDICT_TONES = {
  red: { cls: 'bg-rose-950/80 text-rose-300 border-rose-800', icon: ShieldAlert },
  amber: { cls: 'bg-amber-950/80 text-amber-300 border-amber-800', icon: AlertTriangle },
  green: { cls: 'bg-emerald-950/80 text-emerald-300 border-emerald-800', icon: ShieldCheck },
  grey: { cls: 'bg-slate-800 text-slate-300 border-slate-700', icon: Info }
};

const verdictTone = (verdict = '') => {
  const v = verdict.toLowerCase();
  if (v.includes('possibly') || v.includes('manipulation')) return 'amber';
  if (v.includes('synthetic') || v.includes('generated')) return 'red';
  if (v.includes('authentic')) return 'green';
  return 'grey';
};

const LEVEL_STYLES = {
  high: 'border-rose-700 text-rose-300',
  medium: 'border-amber-700 text-amber-300',
  low: 'border-sky-800 text-sky-300',
  neutral: 'border-slate-700 text-slate-400'
};

const scoreColor = (s) => (s == null ? 'bg-slate-700' : s >= 0.7 ? 'bg-rose-500' : s >= 0.45 ? 'bg-amber-500' : 'bg-emerald-500');

const formatTime = (t) => (t == null ? '' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);

export default function VideoVerifier({ apiKey }) {
  const [videoSrc, setVideoSrc] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const videoRef = useRef(null);
  const inputRef = useRef(null);

  const seek = (t) => {
    if (videoRef.current && t != null) {
      videoRef.current.currentTime = t;
      videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please choose a video file (MP4, MOV, WEBM).');
      return;
    }
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setVideoSrc(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      if (apiKey) form.append('api_key', apiKey);
      const response = await fetch('/api/analyze-video', { method: 'POST', body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || `Server returned ${response.status}`);
      setResult(data);
    } catch (err) {
      setError(`Video analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportJson = () => {
    const { frames, ...rest } = result.report;
    const blob = new Blob([JSON.stringify({ ...result, report: rest }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verilens-video-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const response = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: { ...result.report, metadata: result.metadata, filename: result.filename } })
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const filename = (response.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || `VeriLens_Video_Report_${Date.now()}.pdf`;
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(`Could not generate the PDF report: ${err.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const report = result?.report;
  const meta = result?.metadata;
  const tone = VERDICT_TONES[verdictTone(report?.verdict_category)];
  const VerdictIcon = tone.icon;
  const edit = report?.edit_analysis;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: upload + player + frame strip */}
      <div className="lg:col-span-5 space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragOver ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-700 hover:border-cyan-700 bg-slate-950/40'
          }`}
        >
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <div className="mx-auto w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800 flex items-center justify-center mb-3">
            <Upload className="w-5 h-5 text-cyan-300" />
          </div>
          <p className="text-sm font-bold text-white">Drop a video here, or <span className="text-cyan-400">browse files</span></p>
          <p className="text-xs text-slate-400 mt-1">MP4, MOV, WEBM. Clips under 18 MB are analysed in full; larger ones via sampled frames.</p>
        </div>

        {videoSrc && (
          <div className="rounded-2xl glass-panel border border-slate-800 p-3 space-y-3">
            <video ref={videoRef} src={videoSrc} controls className="w-full rounded-xl bg-black max-h-[420px]" />
            {report?.frames?.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">
                  Sampled frames - neural AI score (click to jump)
                </span>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {report.frames.map((f, i) => (
                    <button key={i} onClick={() => seek(f.t)} className="group text-left">
                      <img src={f.image} alt={`Frame at ${f.t}s`} className="w-full aspect-video object-cover rounded-md border border-slate-800 group-hover:border-cyan-600" />
                      <div className="mt-1 h-1.5 rounded bg-slate-800 overflow-hidden">
                        <div className={`h-full ${scoreColor(f.ai_score)}`} style={{ width: `${Math.round((f.ai_score ?? 0) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatTime(f.t)} · {f.ai_score == null ? 'n/a' : `${Math.round(f.ai_score * 100)}% AI`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {meta && (
          <div className="rounded-2xl glass-panel border border-slate-800 p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {[
              ['Format', `${meta.format || '-'} (${meta.codec || '-'})`],
              ['Resolution', meta.dimensions?.width ? `${meta.dimensions.width} x ${meta.dimensions.height}` : '-'],
              ['Duration', meta.duration_s ? `${meta.duration_s} s @ ${meta.fps || '?'} fps` : '-'],
              ['Size', `${meta.file_size_kb} KB`],
              ['Device', [meta.camera_make, meta.camera_model].filter(Boolean).join(' ') || 'Not recorded'],
              ['Encoder', meta.software || 'Not recorded'],
              ['Created', meta.date_time_original || 'Not recorded'],
              ['Audio', meta.has_audio ? 'Yes' : 'No']
            ].map(([k, v]) => (
              <div key={k}>
                <span className="block text-[10px] uppercase font-mono text-slate-500">{k}</span>
                <span className="text-slate-200 break-words">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: report */}
      <div className="lg:col-span-7">
        {loading ? (
          <div className="rounded-2xl glass-panel border border-slate-800 p-10 flex flex-col items-center text-center space-y-3">
            <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
            <h3 className="text-lg font-bold text-white">Analysing video</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Extracting frames, running the neural detector on each frame, and asking Gemini to check motion, faces and lip-sync. This usually takes 15-40 seconds.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-900 bg-rose-950/40 p-5 text-sm text-rose-200">{error}</div>
        ) : report ? (
          <div className="rounded-2xl glass-panel border border-slate-800 p-5 sm:p-6 space-y-5">
            <div className="space-y-3 pb-4 border-b border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${tone.cls}`}>
                    <VerdictIcon className="w-4 h-4" />
                    {report.verdict_category}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-xs bg-slate-900 text-slate-300 border border-slate-700">
                    Confidence: <strong className="text-white">{report.confidence}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportPdf}
                    disabled={pdfLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-600 disabled:opacity-60 disabled:cursor-wait"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {pdfLoading ? 'Generating...' : 'PDF Report'}
                  </button>
                  <button onClick={exportJson} title="Export raw JSON data" className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-700 rounded-xl">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {pdfError && (
                <p className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-lg px-2.5 py-1.5">{pdfError}</p>
              )}
              <p className="text-sm text-slate-200 font-medium leading-relaxed">{report.summary}</p>
              {report.confidence_explanation && <p className="text-xs text-slate-400 italic">{report.confidence_explanation}</p>}
              {report.api_notice && (
                <p className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-900/60 rounded-lg px-2.5 py-1.5">{report.api_notice}</p>
              )}
            </div>

            {/* AI generation */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-cyan-800/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800"><Bot className="w-4 h-4" /></div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-mono text-cyan-400 font-bold block">AI Generation & Deepfake Analysis</span>
                    <h4 className="text-sm font-bold text-white">{report.ai_assessment?.is_ai_generated}</h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-slate-950 text-slate-200 border-slate-700">
                  {report.ai_probability}% AI probability
                </span>
              </div>
              {report.ai_assessment?.suspected_generator && (
                <p className="text-xs text-slate-300"><strong>Suspected pipeline:</strong> {report.ai_assessment.suspected_generator}</p>
              )}
              {report.probability_breakdown?.length > 0 && (
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-2 space-y-0.5">
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 font-sans">How the AI probability was calculated</span>
                  {report.probability_breakdown.map((s, i) => (
                    <div key={i} className={i === report.probability_breakdown.length - 1 ? 'text-slate-200 font-semibold' : ''}>{s}</div>
                  ))}
                </div>
              )}
              {report.gemini_input && <p className="text-[10px] text-slate-500">Gemini analysed: {report.gemini_input}</p>}
            </div>

            {/* Editing */}
            {edit && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-950 text-amber-300 border border-slate-700"><Sliders className="w-4 h-4" /></div>
                    <span className="text-[10px] uppercase tracking-wider font-mono text-amber-300 font-bold">Editing & Manipulation</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${VERDICT_TONES[edit.tone]?.cls || VERDICT_TONES.grey.cls}`}>
                    {edit.verdict} · {edit.edit_probability}%
                  </span>
                </div>
                <p className="text-xs text-slate-300">{edit.summary}</p>
                {edit.edit_types?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {edit.edit_types.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg text-[11px] bg-amber-950/50 border border-amber-900/60 text-amber-200">{t}</span>
                    ))}
                  </div>
                )}
                {edit.signals?.map((s, i) => (
                  <p key={i} className="text-[11px] text-slate-400 border-l-2 border-slate-700 pl-2">
                    <span className="font-semibold text-slate-300">{s.title}:</span> {s.detail}
                  </p>
                ))}
              </div>
            )}

            {/* Findings with timestamps */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Findings ({report.findings?.length || 0})</h4>
              {report.findings?.map((f, i) => {
                const level = (f.suspicion_level || 'neutral').toLowerCase();
                return (
                  <div key={i} className={`p-3 rounded-xl bg-slate-950/50 border-l-2 border border-slate-800 ${LEVEL_STYLES[level] || LEVEL_STYLES.neutral}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white">{f.label}</span>
                      <div className="flex items-center gap-2">
                        {f.timestamp != null && (
                          <button onClick={() => seek(Number(f.timestamp))} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-950/60 border border-cyan-800 text-cyan-300 hover:bg-cyan-900/60">
                            <Clock className="w-3 h-3" /> {formatTime(Number(f.timestamp))}
                          </button>
                        )}
                        <span className="text-[10px] font-bold uppercase">{level}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{f.what_we_found}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{f.why_suspicious}</p>
                  </div>
                );
              })}
            </div>

            {report.what_to_check_next?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">What to check next</h4>
                <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1">
                  {report.what_to_check_next.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}
            <p className="text-[10px] text-slate-500">{report.disclaimer}</p>
          </div>
        ) : (
          <div className="rounded-2xl glass-panel border border-slate-800 p-10 text-center space-y-3">
            <Film className="w-10 h-10 text-cyan-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Video Deepfake & AI Check</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Upload a clip to check for AI-generated video (Sora, Veo, Kling, Runway), face swaps, lip-sync deepfakes and editing.
              VeriLens scores sampled frames with a neural detector and has Gemini watch the full clip for motion, face and physics inconsistencies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
