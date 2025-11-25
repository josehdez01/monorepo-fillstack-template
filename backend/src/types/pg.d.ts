declare module 'pg' {
    export interface ClientConfig {
        connectionString?: string;
    }

    export interface QueryResult<T = unknown> {
        rows: T[];
        rowCount: number;
    }

    export class Client {
        constructor(config?: ClientConfig | string);
        connect(): Promise<void>;
        end(): Promise<void>;
        query<T = unknown>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>>;
    }
}
