import { z } from 'zod';
import { zodBrand } from './zod-brand.ts';

// Helper to brand numeric IDs with an entity name while keeping validation simple.
// Usage: entityId('User') => Zod schema of Brand<number, 'User'> with int/positive checks.
export const entityId = <Name extends string>(name: Name) =>
    zodBrand(z.number().int().positive(), name);
