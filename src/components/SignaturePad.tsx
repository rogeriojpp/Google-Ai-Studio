import React, { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  initialSignature: string | null;
  onChange: (dataUrl: string | null) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  initialSignature,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentDataRef = useRef<string | null>(initialSignature);
  const [hasSignature, setHasSignature] = useState<boolean>(Boolean(initialSignature));

  const drawDataUrlToCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.width / dpr;
      const cssHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
    };
    img.src = dataUrl;
  };

  useEffect(() => {
    currentDataRef.current = initialSignature;
    setHasSignature(Boolean(initialSignature));

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const setupSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      const prevSnapshot = currentDataRef.current;

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      if (prevSnapshot) {
        drawDataUrlToCanvas(prevSnapshot);
      }
    };

    setupSize();
    const observer = new ResizeObserver(() => setupSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [initialSignature]);

  const getCoordinates = (
    e: React.PointerEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    setHasSignature(true);

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const dataUrl = canvas.toDataURL('image/png');
    currentDataRef.current = dataUrl;
    onChange(dataUrl);
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    currentDataRef.current = null;
    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Assinatura do cliente ou responsável
          </h3>
          <p className="text-xs text-slate-400">
            Assine diretamente na tela com o dedo ou mouse
          </p>
        </div>
        <button
          type="button"
          onClick={limpar}
          className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Eraser className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Limpar</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-36 bg-[#0b1120] border border-dashed border-slate-700 rounded-xl overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="signature-pad w-full h-full block cursor-crosshair"
        />
        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-500">
            Toque e arraste aqui para assinar
          </div>
        )}
      </div>
    </div>
  );
};
