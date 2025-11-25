import { defineModel } from '../define-model.ts';
import type { InferEntity } from '@mikro-orm/core';

export const SessionModel = defineModel('Session', (p) => ({
    sessionId: p.uuid().index(),
    type: p.enum(['user', 'system']),
    ipAddress: p.string().nullable(),
    userAgent: p.string().nullable(),
    createdAt: p.datetime(),
    updatedAt: p.datetime(),
}));

// Top-level schema export for registry and discovery
export const Session = SessionModel.entity;

export type Session = InferEntity<typeof Session>;
