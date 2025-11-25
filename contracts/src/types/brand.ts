import type { BRAND } from 'zod';

// Simple nominal brand type used across entities and contracts.
// Built on Zod's BRAND marker so that types inferred from `.brand<...>()`
// interoperate with `Brand<T, B>`.
export type Brand<T, B extends string | number | symbol> = T & BRAND<B>;
