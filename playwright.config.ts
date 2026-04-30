import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev:modern -- --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 430, height: 932 },
      },
    },
  ],
});

