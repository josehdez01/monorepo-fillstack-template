import { describe, it, expect, expectTypeOf } from 'vitest';
import { EntitySchema, type InferEntity } from '@mikro-orm/core';
import { defineModel } from './define-model.ts';
import type { Brand } from '../types/brand.ts';

describe('defineModel', () => {
    it('infers model fields and branded identifiers from property builders', () => {
        const { entity } = defineModel('TypedUser', (p) => ({
            email: p.string().unique(),
            age: p.integer(),
            isAdmin: p.boolean(),
        }));
        type User = InferEntity<typeof entity>;
        expectTypeOf<User['email']>().toEqualTypeOf<string>();
        expectTypeOf<User['age']>().toEqualTypeOf<number>();
        expectTypeOf<User['isAdmin']>().toEqualTypeOf<boolean>();
        expectTypeOf<User['id']>().toMatchTypeOf<Brand<number, 'TypedUser'>>();
        expectTypeOf<User['createdAt']>().toMatchTypeOf<Date>();
        expect(entity).toBeInstanceOf(EntitySchema);
        expect(entity.meta.properties.email.unique).toBe(true);
    });
    it('composes reusable fields with independent child entity metadata', () => {
        const base = defineModel('Common', (p) => ({ description: p.string() }));
        const child = defineModel('Child', (p) => ({
            ...base.getProperties(p),
            quantity: p.integer(),
        }));
        type Child = InferEntity<typeof child.entity>;
        expectTypeOf<Child['description']>().toEqualTypeOf<string>();
        expectTypeOf<Child['quantity']>().toEqualTypeOf<number>();
        expect(child.entity.meta.name).toBe('Child');
        expect(child.entity.meta.properties).toHaveProperty('quantity');
        expect(base.entity.meta.properties).not.toHaveProperty('quantity');
    });
});
