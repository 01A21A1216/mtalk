import { defineConfig, type PreviewServer } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// MTALK_HTTPS=1 runs the preview with a self-signed certificate so tablets on
// the LAN get a secure context — required for microphone recording and PWA
// service workers in mobile browsers.
const useHttps = !!process.env.MTALK_HTTPS

// MTALK_PAGES=1 builds for GitHub Pages (served under /mtalk/)
const base = process.env.MTALK_PAGES ? '/mtalk/' : '/'

/**
 * Serves a .apk dropped in dist/ as an Android package.
 *
 * Android only passes a download to the package installer when it arrives as
 * application/vnd.android.package-archive. Without it the tablet saves an
 * unknown blob, and because an APK is a zip underneath, a file manager offers
 * to *extract* it instead of installing it.
 */
const apkDownloads = {
  name: 'apk-downloads',
  configurePreviewServer(server: PreviewServer) {
    server.middlewares.use((req, res, next: () => void) => {
      const path = (req.url ?? '').split('?')[0]
      if (path.endsWith('.apk')) {
        const name = path.slice(path.lastIndexOf('/') + 1)
        res.setHeader('Content-Type', 'application/vnd.android.package-archive')
        res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
      }
      next()
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), apkDownloads, ...(useHttps ? [basicSsl()] : [])],
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
