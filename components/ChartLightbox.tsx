'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ZoomIn, ZoomOut, X, RotateCcw } from 'lucide-react';

interface ChartLightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ChartLightbox({ src, alt = 'Chart', open, onClose }: ChartLightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.5;

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (open) resetView();
  }, [open, src, resetView]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(s + ZOOM_STEP, MAX_SCALE));
      if (e.key === '-') setScale((s) => Math.max(s - ZOOM_STEP, MIN_SCALE));
      if (e.key === '0') resetView();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, resetView]);

  useEffect(() => {
    if (!open) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setScale((s) => Math.min(Math.max(s + delta, MIN_SCALE), MAX_SCALE));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [open]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPosition({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    });
  };

  const handlePointerUp = () => setDragging(false);

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank');
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Toolbar */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
            <ToolbarButton onClick={() => setScale((s) => Math.min(s + ZOOM_STEP, MAX_SCALE))} title="Zoom in (+)">
              <ZoomIn className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => setScale((s) => Math.max(s - ZOOM_STEP, MIN_SCALE))} title="Zoom out (-)">
              <ZoomOut className="h-4 w-4" />
            </ToolbarButton>
            <span className="text-xs text-white/60 min-w-[3rem] text-center tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <ToolbarButton onClick={resetView} title="Reset (0)">
              <RotateCcw className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={handleDownload} title="Download">
              <Download className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={onClose} title="Close (Esc)" variant="close">
              <X className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Image */}
          <motion.div
            className="max-h-[90vh] max-w-[95vw] select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={(e) => {
              if (!dragging && scale === 1) {
                setScale(2);
              }
              e.stopPropagation();
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
              draggable={false}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  variant?: 'close';
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg p-2 transition-colors ${
        variant === 'close'
          ? 'bg-red-500/20 hover:bg-red-500/40 text-red-300'
          : 'bg-white/10 hover:bg-white/20 text-white'
      }`}
    >
      {children}
    </button>
  );
}
