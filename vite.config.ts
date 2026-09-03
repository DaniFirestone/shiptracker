import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from /<repo-name>/, not /. The deploy
// workflow sets GITHUB_PAGES=true for that build only; local dev/build/
// preview are unaffected.
const base = process.env.GITHUB_PAGES ? '/shiptracker/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
