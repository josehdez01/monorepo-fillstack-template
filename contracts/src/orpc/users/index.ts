// Namespace: users
import { create } from './create.ts';
import { getById } from './get-by-id.ts';
export { create, getById };

export const users = {
    create,
    getById,
} as const;

export type Users = typeof users;
