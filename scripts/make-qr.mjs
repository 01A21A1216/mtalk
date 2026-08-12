import QRCode from 'qrcode';

/**
 * Writes a QR code a parent can scan from across the room.
 *
 *   node scripts/make-qr.mjs <url> [output.png]
 *
 * Used for both ways of getting MTalk onto a tablet: the APK download for
 * Android, and the plain app URL for an iPad, which installs from the browser
 * as a PWA instead.
 */
const url = process.argv[2] ?? 'http://localhost:4173';
const out = process.argv[3] ?? 'mtalk-qr.png';

await QRCode.toFile(out, url, {
  width: 480,
  margin: 2,
  color: { dark: '#4a2f7a', light: '#ffffff' },
});
console.log('QR written to', out, 'for', url);
