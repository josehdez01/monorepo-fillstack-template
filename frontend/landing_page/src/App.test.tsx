import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from './App';
afterEach(cleanup);
it('links to the two independently deployed applications with accessible names', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('thoughtful start');
    expect(screen.getByRole('link', { name: /Explore the workspace/ }).getAttribute('href')).toBe(
        'http://localhost:5175',
    );
    expect(screen.getByRole('link', { name: /View operations/ }).getAttribute('href')).toBe(
        'http://localhost:5174',
    );
});
