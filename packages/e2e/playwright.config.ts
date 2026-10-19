import { defineConfig, devices } from '@playwright/test';

const apiPort = 4300;
const apiURL = `http://127.0.0.1:${apiPort}`;
const webEnv = {
    VITE_RPC_URL: apiURL,
    VITE_USER_APP_URL: 'http://127.0.0.1:5175',
    VITE_ADMIN_APP_URL: 'http://127.0.0.1:5174',
};

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    ...(process.env.CI ? { workers: 2 } : {}),
    timeout: 30_000,
    expect: { timeout: 10_000 },
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
    use: {
        baseURL: 'http://127.0.0.1:5175',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: [
        {
            command: 'pnpm --dir ../../backend start',
            url: `${apiURL}/health`,
            env: {
                NODE_ENV: 'test',
                PORT: String(apiPort),
                ROLE: 'all',
                CORS_ORIGINS: 'http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175',
            },
            reuseExistingServer: false,
            timeout: 60_000,
        },
        ...(['user_app', 'admin_app', 'landing_page'] as const).map((app, index) => ({
            command: `pnpm --dir ../../frontend/${app} dev --host 127.0.0.1`,
            url: `http://127.0.0.1:${[5175, 5174, 5173][index]}`,
            env: webEnv,
            reuseExistingServer: false,
            timeout: 60_000,
        })),
    ],
});
