import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    'backend',
    'contracts',
    'frontend/landing_page',
    'frontend/admin_app',
    'frontend/user_app',
    'packages/*',
]);
