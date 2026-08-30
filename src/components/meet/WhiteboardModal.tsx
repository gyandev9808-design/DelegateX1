import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Eraser,
  Highlighter,
  Trash2,
  Download,
  Copy,
  FileText,
  Palette,
  X,
  StickyNote,
  Check,
} from 'lucide-react';

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDraftText: string;
  onUpdateDraftText: (text: string) => void;
}

export default function WhiteboardModal({
  isOpen,
  onClose,
  initialDraftText,
  onUpdateDraftText,
}: WhiteboardModalProps) {
  const [activeMode, setActiveMode] = useState<'CANVAS' | 'RESOLUTION'>('CANVAS');
  const [tool, setTool] = useState<'PEN' | 'HIGHLIGHTER' | 'ERASER'>('PEN');
  const [brushColor, setBrushColor] = useState<string>('#38bdf8');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [draftText, setDraftText] = useState(initialDraftText);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef<boolean>(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setDraftText(initialDraftText);
  }, [initialDraftText]);

  useEffect(() => {
    if (!isOpen || activeMode !== 'CANVAS') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Maintain crisp high-DPI scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initial dark slate canvas background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [isOpen, activeMode]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    isDrawing.current = true;
    lastPoint.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'ERASER') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = brushSize * 4;
      ctx.globalAlpha = 1.0;
    } else if (tool === 'HIGHLIGHTER') {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize * 3;
      ctx.globalAlpha = 0.35;
    } else {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = 1.0;
    }

    ctx.stroke();
    lastPoint.current = { x: currentX, y: currentY };
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `mun-whiteboard-${Date.now()}.png`;
    link.href = image;
    link.click();
  };

  const copyClauses = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveResolution = () => {
    onUpdateDraftText(draftText);
    onClose();
  };

  const colors = ['#38bdf8', '#34d399', '#facc15', '#f87171', '#c084fc', '#ffffff'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-cyan-400/30 max-w-4xl w-full rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveMode('CANVAS')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeMode === 'CANVAS'
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Interactive Whiteboard</span>
              </button>

              <button
                onClick={() => setActiveMode('RESOLUTION')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeMode === 'RESOLUTION'
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Working Paper Scratchpad</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeMode === 'CANVAS' && (
              <button
                onClick={downloadCanvasImage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 transition"
              >
                <Download className="h-3.5 w-3.5 text-cyan-300" />
                <span className="hidden sm:inline">Save Image</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 relative flex flex-col overflow-hidden bg-slate-950">
          {activeMode === 'CANVAS' ? (
            <div className="flex-1 flex flex-col relative overflow-hidden">
              {/* Canvas Toolbar Top Bar */}
              <div className="h-14 bg-[#1a1b1e] border-b border-white/10 px-4 flex items-center justify-between z-10 select-none overflow-x-auto gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTool('PEN')}
                    className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      tool === 'PEN'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <PenTool className="h-4 w-4" />
                    <span className="hidden sm:inline">Pen</span>
                  </button>

                  <button
                    onClick={() => setTool('HIGHLIGHTER')}
                    className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      tool === 'HIGHLIGHTER'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Highlighter className="h-4 w-4" />
                    <span className="hidden sm:inline">Highlighter</span>
                  </button>

                  <button
                    onClick={() => setTool('ERASER')}
                    className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      tool === 'ERASER'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Eraser className="h-4 w-4" />
                    <span className="hidden sm:inline">Eraser</span>
                  </button>
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setBrushColor(c);
                        if (tool === 'ERASER') setTool('PEN');
                      }}
                      className={`h-6 w-6 rounded-full transition transform ${
                        brushColor === c && tool !== 'ERASER'
                          ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#1a1b1e]'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Thickness & Clear */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={20}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20 accent-cyan-400 cursor-pointer"
                    title={`Thickness: ${brushSize}px`}
                  />

                  <button
                    onClick={clearCanvas}
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              </div>

              {/* Real Drawing Canvas */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair touch-none"
              />
            </div>
          ) : (
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Multilateral Working Paper Drafting</h4>
                  <p className="text-xs text-slate-400">
                    Draft real-time operative clauses and sponsor lists during unmoderated caucus.
                  </p>
                </div>
                <button
                  onClick={copyClauses}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-white/10 transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Clauses'}</span>
                </button>
              </div>

              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="DRAFT RESOLUTION 1.1&#10;SPONSORS: France, United Kingdom, Brazil&#10;SIGNATORIES: Japan, Ghana, Germany&#10;&#10;The General Assembly,&#10;Recalling its relevant resolutions on international security,&#10;&#10;1. Urges all member states to establish multilateral transparency protocols;&#10;2. Authorizes the deployment of observer delegations under UN mandate..."
                className="flex-1 font-mono text-xs sm:text-sm text-slate-100 bg-slate-900/90 border border-white/15 rounded-2xl p-4 focus:outline-none focus:border-cyan-300 leading-relaxed resize-none overflow-y-auto"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#1a1b1e] border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {activeMode === 'CANVAS' ? 'Live Canvas Engine' : `${draftText.length} characters`}
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Close
            </button>
            {activeMode === 'RESOLUTION' && (
              <button
                onClick={handleSaveResolution}
                className="px-5 py-2 rounded-xl bg-cyan-300 text-slate-950 font-bold text-xs hover:bg-cyan-200 transition shadow-lg shadow-cyan-500/20"
              >
                Save to Floor Draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
