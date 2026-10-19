import { describe, expect, it } from 'vitest';
import { PostgreSqlPlatform } from '@mikro-orm/postgresql';
import { BrandedIdType } from './branded-id-type.ts';

const type = new BrandedIdType<'User'>();
const platform = new PostgreSqlPlatform();
describe('PostgreSQL branded identifiers', () => {
    it('roundtrips valid serial identifiers without changing their numeric values', () => {
        for (const id of [1, 42, 2_147_483_647]) {
            expect(type.convertToDatabaseValue(type.convertToJSValue(id, platform), platform)).toBe(
                id,
            );
        }
    });
    it.each([undefined, NaN, Infinity, 0, -1, 1.5, 2_147_483_648])(
        'rejects IDs outside the actual database type: %s',
        (value) => {
            expect(() => type.convertToDatabaseValue(value, platform)).toThrow();
            expect(() => type.convertToJSValue(value, platform)).toThrow();
        },
    );
});
