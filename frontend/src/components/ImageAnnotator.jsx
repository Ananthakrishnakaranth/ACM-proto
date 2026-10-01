import React, { useState } from 'react';
import { Eye, ZoomIn, ZoomOut, AlertTriangle, Layers } from 'lucide-react';

export default function ImageAnnotator({ 
  imageSrc, 
  findings = [], 
  activeFindingId, 
  onSelectFinding 
}) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filter findings that have 2D bounding boxes: [ymin, xmin, ymax, xmax] normalized 0-1000
  const visualFindings = findings.filter(f => f.box_2d && f.box_2d.length === 4);

  const getSeverityColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return {
          border: 'border-maroon-500',
          bg: 'bg-maroon-500/15',
          text: 'text-maroon-400',
          badge: 'bg-maroon-950 text-maroon-300 border-maroon-800'
        };
      case 'medium':
        return {
          border: 'border-gold-500',
          bg: 'bg-gold-500/15',
          text: 'text-gold-400',
          badge: 'bg-gold-950 text-gold-300 border-gold-800'
        };
      default:
        return {
          border: 'border-gold-500',
          bg: 'bg-gold-500/15',
          text: 'text-gold-400',
          badge: 'bg-gold-950 text-gold-300 border-gold-800'
        };
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-sand-950 border border-sand-800 shadow-2xl flex flex-col">
      
      {/* Top HUD Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-sand-900/90 border-b border-sand-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-[11px] text-sand-300 uppercase tracking-wider">
            Forensic Inspector HUD
          </span>
          {visualFindings.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gold-950 text-gold-400 border border-gold-800">
              {visualFindings.length} Focal Zones
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              showBoxes 
                ? 'bg-gold-950 border border-gold-700 text-gold-300' 
                : 'bg-sand-800 text-sand-400 hover:text-sand-200'
            }`}
            title="Toggle focal bounding boxes"
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Boxes {showBoxes ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setZoomLevel(zoomLevel === 1 ? 1.5 : 1)}
            className="p-1 rounded text-sand-400 hover:text-sand-200 bg-sand-800 hover:bg-sand-700 transition"
            title="Toggle Zoom"
          >
            {zoomLevel === 1 ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Image Stage */}
      <div className="relative overflow-hidden flex items-center justify-center min-h-[320px] max-h-[520px] bg-sand-950 p-2">
        <div 
          className="relative max-w-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Main Inspection Image */}
          <img
            src={imageSrc}
            alt="Forensic Inspection Subject"
            className="max-h-[460px] w-auto object-contain rounded-lg border border-sand-800/80 block select-none"
          />

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

      </div>

    </div>
  );
}
