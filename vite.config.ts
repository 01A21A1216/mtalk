import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// MTALK_HTTPS=1 runs the preview with a self-signed certificate so tablets on
// the LAN get a secure context — required for microphone recording and PWA
// service workers in mobile browsers.
const useHttps = !!process.env.MTALK_HTTPS

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
  // Listen on all interfaces so tablets on the same WiFi can connect
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: useHttps ? 4174 : 4173,
  },
})
