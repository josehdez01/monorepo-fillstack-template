import { describe, expect, it } from 'vitest';
import { appContract } from './contract.ts';
import { entityId } from '../utils/entity-id.ts';
import { queueContracts } from '../queues/sum.ts';

describe('public contracts', () => {
    it('declares demo revocation and typed conflict recovery', () => {
        expect(appContract.session).toHaveProperty('revokeSession');
        expect(appContract.users.create['~orpc'].errorMap).toHaveProperty('CONFLICT');
        expect(appContract.session.createSession['~orpc'].errorMap).toHaveProperty('FORBIDDEN');
    });
    it('rejects invalid public entity identifiers', () => {
        const id = entityId('User');
        for (const value of [
            0,
            -1,
            0.5,
            '1',
            Infinity,
            Number.MAX_SAFE_INTEGER + 1,
            2_147_483_648,
        ]) {
            expect(id.safeParse(value).success).toBe(false);
        }
        expect(id.parse(1)).toBe(1);
    });
    it('shares queue data schemas independently from backend implementations', async () => {
        const schema = queueContracts.sum.definition.input;
        expect(schema).toBeDefined();
        expect(await schema?.['~standard'].validate({ a: 1, b: 2 })).toMatchObject({
            value: { a: 1, b: 2 },
        });
        expect(await schema?.['~standard'].validate({ a: Infinity, b: 2 })).toHaveProperty(
            'issues',
        );
    });
});
