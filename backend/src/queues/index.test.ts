import { describe, it, expect } from 'vitest';
import { registerQueues, queues } from './index.ts';

describe('queues registry', () => {
    it('registers known queues', () => {
        const res = registerQueues();
        expect(res).toBe(queues);
        expect(Object.keys(res)).toContain('sum');
    });
});
