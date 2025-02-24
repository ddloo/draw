import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@Core': path.resolve(__dirname, './src/core'),
      '@Shape': path.resolve(__dirname, './src/Shape'),
      '@Utils': path.resolve(__dirname, './src/Utils'),
      '@Events': path.resolve(__dirname, './src/Events'),
    }
  }
})