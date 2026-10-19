import { describe, it, expect } from 'vitest';
import { queueContracts, queueImplementations } from './index.ts';

describe('queue contracts', () => {
    it('shares versioned producer contracts without side effects on import', () => {
        expect(queueContracts.sum.definition.name).toBe('sum');
        expect(queueImplementations.sum.definition).toBe(queueContracts.sum.definition);
        expect(queueImplementations.sum.workerOptions).toMatchObject({
            concurrency: 5,
            timeoutMs: 10_000,
        });
    });
});
