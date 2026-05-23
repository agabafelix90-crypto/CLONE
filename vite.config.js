const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig({
  plugins: [
    react({ include: '**/*.{js,jsx,ts,tsx}' })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'js')
    }
  },
  server: {
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    historyApiFallback: true
  },
  define: {
    global: 'window',
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key')
  }
});
