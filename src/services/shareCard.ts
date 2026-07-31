import { wordLabel } from '../i18n';
import type { Language, Word } from '../types';

/**
 * Renders the sentence strip as a picture card and shares it (WhatsApp etc.)
 * via the system share sheet, falling back to a file download on desktop.
 */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function shareSentenceCard(
  words: Word[],
  language: Language,
): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    const perRow = Math.min(5, Math.max(2, words.length));
    const rows = Math.ceil(words.length / perRow);
    const TILE = 220;
    const LABEL_H = 64;
    const GAP = 22;
    const PAD = 48;
    const HEADER = 86;
    const FOOTER = 96;
    const width = PAD * 2 + perRow * TILE + (perRow - 1) * GAP;
    const height = PAD * 2 + HEADER + rows * (TILE + LABEL_H) + (rows - 1) * GAP + FOOTER;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // soft background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#fef6ff');
    bg.addColorStop(1, '#f0fff4');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // header
    ctx.fillStyle = '#5e35b1';
    ctx.font = 'bold 44px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🗣️ MTalk', PAD, PAD + 26);

    // tiles
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = PAD + col * (TILE + GAP);
      const y = PAD + HEADER + row * (TILE + LABEL_H + GAP);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#f9a825';
      ctx.lineWidth = 6;
      roundRect(ctx, x, y, TILE, TILE, 30);
      ctx.fill();
      ctx.stroke();

      if (word.image) {
        const img = await loadImage(word.image);
        if (img) {
          ctx.save();
          roundRect(ctx, x + 14, y + 14, TILE - 28, TILE - 28, 20);
          ctx.clip();
          ctx.drawImage(img, x + 14, y + 14, TILE - 28, TILE - 28);
          ctx.restore();
        }
      } else {
        ctx.font = '120px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(word.emoji, x + TILE / 2, y + TILE / 2 + 8);
      }

      ctx.fillStyle = '#4a2f7a';
      ctx.font = 'bold 30px "Segoe UI", "Nirmala UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = wordLabel(word, language);
      ctx.fillText(label.length > 14 ? `${label.slice(0, 13)}…` : label, x + TILE / 2, y + TILE + LABEL_H / 2);
    }

    // full sentence at the bottom
    ctx.fillStyle = '#311b63';
    ctx.font = 'bold 38px "Segoe UI", "Nirmala UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    const sentence = words.map((w) => wordLabel(w, language)).join('  ');
    ctx.fillText(
      sentence.length > 60 ? `${sentence.slice(0, 59)}…` : sentence,
      width / 2,
      height - PAD - FOOTER / 2 + 10,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) return 'failed';

    const file = new File([blob], 'mtalk-message.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'MTalk message' });
        return 'shared';
      } catch {
        // user cancelled the sheet — treat as done
        return 'shared';
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mtalk-message.png';
    a.click();
    URL.revokeObjectURL(a.href);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
