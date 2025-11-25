import { defineEntity } from '@mikro-orm/core';
import { getBaseProperties } from './entities/base.ts';

// Define entities using MikroORM's property builders for end-to-end inference.
// - Ensures Opt and Hidden flags propagate automatically (e.g., onCreate/onUpdate)
// - Avoids custom prop typing and unnecessary casts
export function defineModel<Name extends string, Props extends Record<string, unknown>>(
    name: Name,
    properties: (p: typeof defineEntity.properties) => Props,
) {
    // Prefer builder-style properties to unlock full type inference.
    // Fallback: if an object is provided, we still construct a valid schema,
    // but inference will be limited to MikroORM’s default heuristics.
    const propertiesBuilder = (p: typeof defineEntity.properties) => ({
        ...getBaseProperties<Name>(p),
        ...properties(p),
    });

    const entity = defineEntity({
        name,
        properties: propertiesBuilder,
    });

    // Expose the propertiesBuilder for composition during runtime and compile-time.
    return {
        entity,
        getProperties: propertiesBuilder,
    };
}
