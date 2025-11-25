import type { defineEntity } from '@mikro-orm/core';
import { BrandedIdType } from '../types/branded-id-type.ts';
import type { Brand } from '../../types/brand.ts';

export const getBaseProperties = <Name extends string>(p: typeof defineEntity.properties) => {
    return {
        id: p
            .type(new BrandedIdType<Name>())
            .$type<Brand<number, Name>, number>()
            .primary()
            .autoincrement(),
        createdAt: p.datetime().onCreate(() => new Date()),
        updatedAt: p
            .datetime()
            .onCreate(() => new Date())
            .onUpdate(() => new Date()),
    } as const;
};
