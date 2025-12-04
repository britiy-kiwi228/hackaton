import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
var __dirname = path.dirname(new URL(import.meta.url).pathname);
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        open: true,
    },
});
