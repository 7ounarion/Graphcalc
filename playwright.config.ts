import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { channel: 'msedge', baseURL: 'http://localhost:4317', trace: 'retain-on-failure' },
  projects: ['light', 'dark'].flatMap(colorScheme => [
    { name: `${colorScheme}-wide`, use: { viewport: { width: 1280, height: 800 }, colorScheme: colorScheme as 'light' | 'dark' } },
    { name: `${colorScheme}-narrow`, use: { viewport: { width: 920, height: 650 }, colorScheme: colorScheme as 'light' | 'dark' } },
  ]),
  webServer: { command: 'npm run build && npx vite preview --port 4317 --strictPort', url: 'http://localhost:4317', reuseExistingServer: false },
});
