import type { BRAND } from 'zod';

// Nominal brand helper for backend types, aligned with Zod's branding
// so values branded via zod `.brand<...>()` interoperate with entity IDs.
export type Brand<T, B extends string | number | symbol> = T & BRAND<B>;

export type WithBrandedId<T, B extends string | number | symbol> = Omit<T, 'id'> & {
    id: Brand<T extends { id: infer I } ? I : never, B>;
};
