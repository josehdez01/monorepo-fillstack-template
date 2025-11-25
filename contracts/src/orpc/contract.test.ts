import { describe, expect, it } from 'vitest';
import { appContract } from './contract.ts';

describe('contracts', () => {
    it('exposes hello.greet', () => {
        expect(typeof appContract.hello.greet).toBe('object');
    });
});
