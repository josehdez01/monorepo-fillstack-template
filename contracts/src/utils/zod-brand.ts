import type { z } from 'zod';

// Wraps a Zod schema to brand its output while keeping the same input type.
// Uses Zod's native `.brand` to ensure nominal typing across schemas without
// reaching into Zod's internal types.
export const zodBrand = <T extends z.ZodTypeAny, B extends string | number | symbol>(
    schema: T,
    _brand?: B,
) => schema.brand<B>();
