export abstract class AppError<TData = unknown> extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number,
        public readonly data?: TData,
        options?: ErrorOptions,
    ) {
        super(message, options);
        this.name = new.target.name;
    }
}

export class ValidationError extends AppError<{ field?: string }> {
    constructor(message: string, field?: string) {
        // With exactOptionalPropertyTypes, avoid passing `{ field: undefined }`
        // Only include `data` when a field value is provided
        super(message, 'VALIDATION_ERROR', 400, field !== undefined ? { field } : undefined);
    }
}

export class NotFoundError extends AppError<undefined> {
    constructor(message = 'Resource not found') {
        super(message, 'NOT_FOUND', 404);
    }
}

export class AuthError extends AppError<undefined> {
    constructor(message = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401);
    }
}
