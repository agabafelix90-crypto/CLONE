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
  define: {
    global: 'window',
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://jzfdxstpomdcoucywimy.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_f7FTaja3G59yW29OAGulbQ_KwllAjL5')
  }
});
