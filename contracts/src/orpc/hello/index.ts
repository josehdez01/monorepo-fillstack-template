// Namespace: hello
// Import procedures and aggregate into a namespace object.
import { greet } from './greet.ts';
export { greet };

export const hello = {
    greet,
} as const;

export type Hello = typeof hello;
