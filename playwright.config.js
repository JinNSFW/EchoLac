// Phase 6 smoke tests (AGENTS §8): real Chromium at phone width against the local servers.
// The site runs with cloud sync off (config.js is stubbed per test), so no real Supabase accounts are created.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { viewport: { width: 360, height: 740 }, serviceWorkers: 'block', locale: 'vi-VN' },
  webServer: [
    { command: 'node scripts/serve.cjs', url: 'http://127.0.0.1:4199/', env: { PORT: '4199' }, reuseExistingServer: false },
    { command: 'node scripts/admin-serve.cjs', url: 'http://127.0.0.1:4198/', env: { ADMIN_PORT: '4198' }, reuseExistingServer: false },
  ],
});
