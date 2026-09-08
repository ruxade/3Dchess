import { defineConfig } from 'vite'

// Vite needs almost no configuration for a vanilla Three.js project.
// - `public/` is served at the site root (so '/models/...' works in dev AND build)
// - `index.html` is the game, `demo.html` the self-playing demo; /demo serves it
// - `src/main.js` is loaded from both with <script type="module">
export default defineConfig({
  plugins: [{
    name: 'demo-route',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/demo' || req.url.startsWith('/demo?')) req.url = req.url.replace('/demo', '/demo.html')
        next()
      })
    }
  }],
  server: {
    host: true,   // also expose on the LAN (phone testing)
    open: true    // open the browser on `npm run dev`
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      input: { main: 'index.html', demo: 'demo.html' }
    }
  }
})
