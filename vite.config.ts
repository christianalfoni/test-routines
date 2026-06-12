import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { reactx } from 'reactx/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [reactx(), react()],
})
