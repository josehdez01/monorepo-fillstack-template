import { defineModel } from './define-model.ts';
import { describe, it, expect } from 'vitest';
import type { Brand } from '../types/brand.ts';
import { EntitySchema, type InferEntity } from '@mikro-orm/core';

describe('defineModel Inference', () => {
    it('should infer correct types for a simple model', () => {
        const { entity: UserSchema } = defineModel('User', (p) => ({
            email: p.string().unique(),
            age: p.integer(),
            isAdmin: p.boolean(),
        }));

        // Extract the inferred type
        type User = InferEntity<typeof UserSchema>;

        // Or better, we want to infer it FROM the schema return if possible,
        // but EntitySchema<T> holds T.

        // Let's verify the type structure matches our expectation
        // Verify types via assignment compatibility
        const u: User = {} as unknown as User;
        const _email: string = u.email;
        const _age: number = u.age;
        const _isAdmin: boolean = u.isAdmin;
        const _id: Brand<number, 'User'> = u.id;
        const _createdAt: Date = u.createdAt;

        expect(true).toBe(true); // Runtime check passed if compiled
    });

    it('should create a valid runtime schema', () => {
        const { entity: UserSchema } = defineModel('User', (p) => ({
            email: p.string().unique(),
        }));

        expect(UserSchema).toBeInstanceOf(EntitySchema);
        expect(UserSchema.meta.name).toBe('User');
        expect(UserSchema.meta.properties).toHaveProperty('id');
        expect(UserSchema.meta.properties).toHaveProperty('createdAt');
        expect(UserSchema.meta.properties).toHaveProperty('email');
    });

    it('should support extension/composition', () => {
        const { getProperties: getBaseProperties } = defineModel('Base', (p) => ({
            baseProp: p.string(),
        }));

        const { entity: ChildSchema } = defineModel('Child', (p) => ({
            ...getBaseProperties(p),
            childProp: p.integer(),
        }));

        // Runtime meta should reflect composition via property spreading
        expect(ChildSchema.meta.properties).toHaveProperty('childProp');
        expect(ChildSchema.meta.properties).toHaveProperty('baseProp');
        expect(ChildSchema.meta.properties).toHaveProperty('id');

        // Compile-time: InferEntity currently reflects only child-level props with defineEntity’s extends,
        // so intersect with base to assert extended shape.
        type Child = InferEntity<typeof ChildSchema>;
        const c: Child = {} as unknown as Child;
        const _base: string = c.baseProp;
        const _child: number = c.childProp;

        expect(true).toBe(true);
    });
});
