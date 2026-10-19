import { describe, expect, it } from 'vitest';
import generator from '../turbo/generators/config.js';

describe('generator input boundaries', () => {
    const configs = new Map<string, { actions: Array<unknown> }>();
    generator({
        setGenerator(name: string, config: { actions: Array<unknown> }) {
            configs.set(name, config);
        },
    });
    it.each(['../outside', 'Bad Name', '', 'constructor', 'a/../../x'])(
        'rejects unsafe name %s before any write',
        (name) => {
            for (const config of configs.values()) {
                const guard = config.actions[0] as (data: { name: string }) => string;
                expect(() => guard({ name })).toThrow('lowercase kebab-case');
            }
        },
    );
    it('accepts descriptive names for all generators', () => {
        expect(configs.size).toBe(5);
        for (const config of configs.values()) {
            const guard = config.actions[0] as (data: { name: string }) => string;
            expect(guard({ name: 'billing-report' })).toBe('Validated name');
        }
    });
});
