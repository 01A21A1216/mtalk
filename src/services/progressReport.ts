import { wordLabel } from '../i18n';
import type { Language, Word } from '../types';

/**
 * Renders a clean progress-report card (for therapist visits / family) and
 * shares it via the system sheet, falling back to a download on desktop.
 */

interface ReportData {
  childName: string;
  language: Language;
  usedThisWeek: number;
  newThisWeek: number;
  masteredCount: number;
  practicedCount: number;
  topWords: Word[];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function shareProgressReport(data: ReportData): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    const W = 1080;
    const H = 1350;
    const PAD = 60;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#fef6ff');
    bg.addColorStop(1, '#eef7ff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // header
    ctx.fillStyle = '#5e35b1';
    ctx.font = 'bold 56px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('🗣️ MTalk — Progress Report', PAD, PAD + 50);

    ctx.fillStyle = '#4a3f60';
    ctx.font = 'bold 40px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(data.childName, PAD, PAD + 120);
    ctx.fillStyle = '#8a7f9a';
    ctx.font = '30px "Segoe UI", system-ui, sans-serif';
    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillText(date, PAD, PAD + 165);

    // stat boxes (2x2)
    const stats: [string, string, string][] = [
      [String(data.usedThisWeek), 'different words used this week', '#E8F5E9'],
      [String(data.newThisWeek), 'new words this week', '#E3F2FD'],
      [String(data.masteredCount), 'quiz words mastered', '#FFF8E1'],
      [String(data.practicedCount), 'quiz words practised', '#FCE4EC'],
    ];
    const boxW = (W - PAD * 2 - 40) / 2;
    const boxH = 190;
    stats.forEach(([num, label, color], i) => {
      const x = PAD + (i % 2) * (boxW + 40);
      const y = 300 + Math.floor(i / 2) * (boxH + 36);
      ctx.fillStyle = color;
      roundRect(ctx, x, y, boxW, boxH, 26);
      ctx.fill();
      ctx.fillStyle = '#311b63';
      ctx.font = 'bold 76px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(num, x + boxW / 2, y + 95);
      ctx.fillStyle = '#5f5478';
      ctx.font = '600 28px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(label, x + boxW / 2, y + 150);
    });

    // top words
    ctx.fillStyle = '#4a3f60';
    ctx.font = 'bold 38px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Most-used words', PAD, 830);

    const chips = data.topWords.slice(0, 10);
    let cx = PAD;
    let cy = 880;
    ctx.font = '600 32px "Segoe UI", "Nirmala UI", system-ui, sans-serif';
    for (const w of chips) {
      const label = `${w.image ? '⭐' : w.emoji}  ${wordLabel(w, data.language)}`;
      const tw = ctx.measureText(label).width + 56;
      if (cx + tw > W - PAD) {
        cx = PAD;
        cy += 84;
      }
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d5c8ef';
      ctx.lineWidth = 4;
      roundRect(ctx, cx, cy, tw, 64, 32);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4a3f60';
      ctx.fillText(label, cx + 28, cy + 44);
      cx += tw + 20;
    }
    if (chips.length === 0) {
      ctx.fillStyle = '#8a7f9a';
      ctx.fillText('No words tapped yet — start talking!', PAD, 900);
    }

    // footer
    ctx.fillStyle = '#9e93b5';
    ctx.font = '26px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Made with MTalk — AAC & learning app for non-verbal kids', W / 2, H - 50);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return 'failed';

    const file = new File([blob], `mtalk-progress-${data.childName}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'MTalk progress report' });
        return 'shared';
      } catch {
        return 'shared';
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
