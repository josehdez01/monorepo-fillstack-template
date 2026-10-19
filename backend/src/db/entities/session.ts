import { defineModel } from '../define-model.ts';
import type { InferEntity } from '@mikro-orm/core';

export const SessionModel = defineModel('Session', (p) => ({
    sessionId: p.uuid().unique(),
    type: p.enum(['user', 'system']),
    ipAddress: p.string().nullable(),
    userAgent: p.text().nullable(),
    expiresAt: p.datetime().index(),
    revokedAt: p.datetime().nullable(),
}));
export const Session = SessionModel.entity;
export type Session = InferEntity<typeof Session>;
