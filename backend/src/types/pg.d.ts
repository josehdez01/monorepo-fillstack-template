declare module 'pg' {
    export class Client {
        constructor(opts: { connectionString: string } | unknown);
        connect(): Promise<void>;
        end(): Promise<void>;
        query<T = unknown>(
            sql: string,
            params?: unknown[],
        ): Promise<{ rows: T[]; rowCount: number }>;
    }
}
