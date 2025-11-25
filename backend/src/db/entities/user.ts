import { defineModel } from '../define-model.ts';
import type { InferEntity } from '@mikro-orm/core';

export const UserModel = defineModel('User', (p) => ({
    email: p.string().unique(),
}));

// Top-level schema export for registry and discovery
export const User = UserModel.entity;

export type User = InferEntity<typeof User>;
