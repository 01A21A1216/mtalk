import { useEffect, useRef, useState } from 'react';
import { SCRIPT_SETS, TRACE_SETS, type TraceItem } from '../data/traceSets';
import { playPop, speak } from '../services/speech';

interface WritePadProps {
  rate: number;
  /** Active tracing set id from the sidebar; null = free painting */
  setId: string | null;
}

const COLORS = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA', '#6D4C41'];

/**
 * Tracing + free painting. A ghost glyph (outlined letter/shape, or a faded
 * picture) sits behind a canvas the child draws on; Paint gives a blank sheet.
 */
export function WritePad({ rate, setId }: WritePadProps) {
  const [item, setItem] = useState<TraceItem | null>(null);
  const [color, setColor] = useState(COLORS[4]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);

  const allSets = [...TRACE_SETS, ...Object.values(SCRIPT_SETS)];
  const activeSet = allSets.find((s) => s.id === setId) ?? null;

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // New set picked in the sidebar: start at its first item with a clean sheet
  useEffect(() => {
    const first =
      [...TRACE_SETS, ...Object.values(SCRIPT_SETS)].find((s) => s.id === setId)?.items[0] ?? null;
    setItem(first);
    clearCanvas();
    if (first) speak(first.name, 'en', rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  // Match the canvas bitmap to its on-screen size (redone on resize)
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(box.clientWidth * dpr);
      canvas.height = Math.round(box.clientHeight * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startStroke = (e: React.PointerEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawingRef.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };

  const moveStroke = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endStroke = () => {
    drawingRef.current = false;
  };

  const pickItem = (next: TraceItem) => {
    playPop();
    setItem(next);
    clearCanvas();
    speak(next.name, 'en', rate);
  };

  return (
    <main className="write-pad">
      {activeSet && (
        <div className="write-letters">
          {activeSet.items.map((it) => (
            <button
              key={it.glyph}
              className={`write-chip ${item?.glyph === it.glyph ? 'write-chip-active' : ''}`}
              onClick={() => pickItem(it)}
              aria-label={it.name}
            >
              {it.glyph}
            </button>
          ))}
        </div>
      )}

      <div className="write-box" ref={boxRef}>
        {activeSet && item && (
          <span
            className={activeSet.emojiGhost ? 'write-ghost-emoji' : 'write-ghost'}
            aria-hidden="true"
          >
            {item.glyph}
          </span>
        )}
        <canvas
          ref={canvasRef}
          className="write-canvas"
          onPointerDown={startStroke}
          onPointerMove={moveStroke}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        />
      </div>

      <div className="write-tools">
        {COLORS.map((c) => (
          <button
            key={c}
            className={`write-color ${color === c ? 'write-color-active' : ''}`}
            style={{ background: c }}
            onClick={() => {
              playPop();
              setColor(c);
            }}
            aria-label={`Colour ${c}`}
          />
        ))}
        <button className="btn-clear write-clear" onClick={clearCanvas} aria-label="Clear drawing">
          🧹
        </button>
        {item && activeSet && (
          <button
            className="btn-history write-speak"
            onClick={() => speak(item.name, 'en', rate)}
            aria-label="Say it again"
          >
            🔊
          </button>
        )}
      </div>
    </main>
  );
}
