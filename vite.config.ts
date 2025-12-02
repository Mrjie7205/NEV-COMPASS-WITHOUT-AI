import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Declare process to fix TypeScript error TS2580
declare const process: any;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // 这是一个垫片，让代码中的 process.env.API_KEY 在浏览器中也能工作
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});