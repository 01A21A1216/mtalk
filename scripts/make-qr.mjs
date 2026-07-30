import QRCode from 'qrcode';

const url = process.argv[2] ?? 'http://10.0.0.67:4173';
await QRCode.toFile('mtalk-qr.png', url, {
  width: 480,
  margin: 2,
  color: { dark: '#4a2f7a', light: '#ffffff' },
});
console.log('QR written for', url);
