import { defineConfig } from '@playwright/test'

// Runs against a production build on port 3100. Without real Supabase keys
// only the logged-out flows can be driven; see replica/test-plan.md.
export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:3100' },
  webServer: {
    command: 'npm run build && npx next start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 300_000,
  },
})
