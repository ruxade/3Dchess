import { defineConfig } from 'vite'

// Vite needs almost no configuration for a vanilla Three.js project.
// - `public/` is served at the site root (so '/models/...' works in dev AND build)
// - `index.html` at the project root is the entry point
// - `src/main.js` is loaded from index.html with <script type="module">
export default defineConfig({
  server: {
    host: true,   // also expose on the LAN (phone testing)
    open: true    // open the browser on `npm run dev`
  },
  build: {
    sourcemap: true
  }
})
