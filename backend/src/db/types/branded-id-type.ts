import { Type, ValidationError, type EntityProperty, type Platform } from '@mikro-orm/core';
import type { Brand } from '../../types/brand.ts';

export class BrandedIdType<Tag> extends Type<Brand<number, Tag>, number> {
    override convertToDatabaseValue(
        value: Brand<number, Tag> | number | undefined,
        _platform: Platform,
    ): number {
        if (value === undefined || value === null) {
            throw ValidationError.invalidType(BrandedIdType, value, 'JS');
        }
        if (!Number.isFinite(value)) {
            throw ValidationError.invalidType(BrandedIdType, value, 'JS');
        }
        return value;
    }

    override convertToJSValue(value: number | undefined, _platform: Platform): Brand<number, Tag> {
        return value as unknown as Brand<number, Tag>;
    }

    override getColumnType(_prop: EntityProperty, _platform: Platform) {
        return 'int';
    }
}
