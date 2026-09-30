import React, { useState } from 'react';
import { Eye, ZoomIn, ZoomOut, Scan, AlertTriangle, Layers, Info } from 'lucide-react';

export default function ImageAnnotator({ 
  imageSrc, 
  findings = [], 
  activeFindingId, 
  onSelectFinding 
}) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showScanline, setShowScanline] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filter findings that have 2D bounding boxes: [ymin, xmin, ymax, xmax] normalized 0-1000
  const visualFindings = findings.filter(f => f.box_2d && f.box_2d.length === 4);

  const getSeverityColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return {
          border: 'border-rose-500',
          bg: 'bg-rose-500/15',
          text: 'text-rose-400',
          badge: 'bg-rose-950 text-rose-300 border-rose-800'
        };
      case 'medium':
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-500/15',
          text: 'text-amber-400',
          badge: 'bg-amber-950 text-amber-300 border-amber-800'
        };
      default:
        return {
          border: 'border-cyan-500',
          bg: 'bg-cyan-500/15',
          text: 'text-cyan-400',
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-800'
        };
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
      
      {/* Top HUD Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-[11px] text-slate-300 uppercase tracking-wider">
            Forensic Inspector HUD
          </span>
          {visualFindings.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
              {visualFindings.length} Focal Zones
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              showBoxes 
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-300' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle focal bounding boxes"
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Boxes {showBoxes ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setShowScanline(!showScanline)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              showScanline 
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-300' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle forensic scanning line"
          >
            <Scan className="w-3.5 h-3.5 inline mr-1" />
            Scan
          </button>

          <button
            onClick={() => setZoomLevel(zoomLevel === 1 ? 1.5 : 1)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition"
            title="Toggle Zoom"
          >
            {zoomLevel === 1 ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Image Stage */}
      <div className="relative overflow-hidden flex items-center justify-center min-h-[320px] max-h-[520px] bg-slate-950 p-2 cyber-grid">
        <div 
          className="relative max-w-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Main Inspection Image */}
          <img
            src={imageSrc}
            alt="Forensic Inspection Subject"
            className="max-h-[460px] w-auto object-contain rounded-lg border border-slate-800/80 block select-none"
          />

          {/* Animated Scanning Beam */}
          {showScanline && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] pointer-events-none animate-scanline" />
          )}

          {/* Interactive Bounding Boxes Overlay */}
          {showBoxes && visualFindings.map((finding) => {
            const [ymin, xmin, ymax, xmax] = finding.box_2d;
            const top = `${(ymin / 1000) * 100}%`;
            const left = `${(xmin / 1000) * 100}%`;
            const height = `${((ymax - ymin) / 1000) * 100}%`;
            const width = `${((xmax - xmin) / 1000) * 100}%`;

            const colors = getSeverityColor(finding.suspicion_level);
            const isActive = activeFindingId === finding.id;

            return (
              <div
                key={finding.id}
                onClick={() => onSelectFinding(finding.id)}
                style={{ top, left, height, width }}
                className={`absolute cursor-pointer border-2 transition-all duration-200 group z-20 ${
                  isActive 
                    ? `${colors.border} ${colors.bg} ring-2 ring-white/60 scale-[1.02]` 
                    : `${colors.border} bg-transparent hover:${colors.bg} opacity-80 hover:opacity-100`
                }`}
              >
                {/* Corner markers */}
                <span className="absolute -top-1 -left-1 w-2 h-2 bg-white" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-white" />
                <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white" />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white" />

                {/* Floating Finding Tag */}
                <div className={`absolute -top-7 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-md border ${colors.badge} transition-transform ${
                  isActive ? 'scale-105 font-bold' : 'group-hover:scale-105'
                }`}>
                  {finding.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reticle Guide Corners */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50 pointer-events-none" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50 pointer-events-none" />
      </div>

      {/* Footer Info Pill */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center space-x-1">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Click any focal zone or list card to cross-inspect evidence.</span>
        </span>
        <span className="font-mono text-[10px] text-slate-500">
          Scale: {Math.round(zoomLevel * 100)}%
        </span>
      </div>

    </div>
  );
}
