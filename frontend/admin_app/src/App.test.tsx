import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.tsx';

vi.mock('@/components/hello-message', () => ({ default: () => null }));

describe('App', () => {
    it('renders header text', () => {
        render(<App />);
        expect(screen.getByText('Monorepo Template - Admin App')).toBeDefined();
    });
});
