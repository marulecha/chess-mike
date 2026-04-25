import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use relative asset paths so the build works under any subdirectory
// (e.g. https://<user>.github.io/<repo>/) without recompiling.
export default defineConfig({
  plugins: [react()],
  base: './',
});
