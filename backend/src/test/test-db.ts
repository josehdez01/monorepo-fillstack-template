import { Client } from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID, createHash } from 'node:crypto';
import { getEnv } from '../config/env.ts';

function parseDbUrl(url: string): URL {
    try {
        return new URL(url);
    } catch (err) {
        throw new Error('Invalid DATABASE_URL', { cause: err });
    }
}

function formatDbUrlLike(input: URL, dbName: string): string {
    const u = new URL(input.toString());
    u.pathname = `/${dbName}`;
    return u.toString();
}

async function query(connStr: string, sql: string, params: unknown[] = []): Promise<void> {
    const client = new Client({ connectionString: connStr });
    await client.connect();
    try {
        await client.query(sql, params as unknown[]);
    } finally {
        await client.end();
    }
}

async function dbExists(connStr: string, name: string): Promise<boolean> {
    const client = new Client({ connectionString: connStr });
    await client.connect();
    try {
        const r = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
        return r.rowCount > 0;
    } finally {
        await client.end();
    }
}

export class TestDbManager {
    private baseUrl: URL;
    private adminUrl: string; // connects to postgres DB
    private baseDbName: string;
    private cachedTemplateName?: string;

    constructor() {
        const env = getEnv();
        this.baseUrl = parseDbUrl(env.DATABASE_URL);
        this.baseDbName = this.baseUrl.pathname.replace(/^\//, '') || 'postgres';
        const adminDb = 'postgres';
        this.adminUrl = formatDbUrlLike(this.baseUrl, adminDb);
    }

    private templateUrl(name: string): string {
        return formatDbUrlLike(this.baseUrl, name);
    }

    private async computeSchemaFingerprint(): Promise<string> {
        // Initialize ORM using current env.DATABASE_URL (must point to an existing DB)
        const { default: ormConfig } = await import('../../mikro-orm.config.ts');
        const orm = await MikroORM.init(ormConfig);
        try {
            const gen = orm.getSchemaGenerator();
            const sql = await gen.getCreateSchemaSQL();
            const normalized = sql.replace(/\s+/g, ' ').trim();
            const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 8);
            return hash;
        } finally {
            await orm.close(true);
        }
    }

    private async getTemplateName(): Promise<string> {
        if (this.cachedTemplateName) {
            return this.cachedTemplateName;
        }
        const hash = await this.computeSchemaFingerprint();
        const name = `${this.baseDbName}_tmpl_${hash}`;
        this.cachedTemplateName = name;
        return name;
    }

    async ensureTemplate(rebuild = false): Promise<string> {
        const tmplName = await this.getTemplateName();
        const exists = await dbExists(this.adminUrl, tmplName);
        const forceRebuild = rebuild || process.env.TEST_DB_REBUILD_TEMPLATE === '1';
        if (exists && !forceRebuild) {
            return tmplName;
        }
        if (exists && forceRebuild) {
            await this.dropDatabase(tmplName);
        }
        await query(this.adminUrl, `CREATE DATABASE ${quoteIdent(tmplName)}`);

        // Initialize schema inside the template DB using MikroORM metadata
        const prev = process.env.DATABASE_URL;
        try {
            process.env.DATABASE_URL = this.templateUrl(tmplName);
            // Use dynamic import to ensure env is applied
            const { default: ormConfig } = await import('../../mikro-orm.config.ts');
            const orm = await MikroORM.init(ormConfig);
            const gen = orm.getSchemaGenerator();
            await gen.createSchema();
            await orm.close(true);
        } finally {
            if (prev !== undefined) {
                process.env.DATABASE_URL = prev;
            } else {
                delete process.env.DATABASE_URL;
            }
        }
        return tmplName;
    }

    async createEphemeral(): Promise<{ name: string; url: string }> {
        // Create a unique DB cloned from the fingerprinted template
        const ident = randomUUID().slice(0, 8);
        const name = `${this.baseDbName}_test_${ident}`;
        const templateName = await this.ensureTemplate(false);
        await query(
            this.adminUrl,
            `CREATE DATABASE ${quoteIdent(name)} TEMPLATE ${quoteIdent(templateName)}`,
        );
        const url = formatDbUrlLike(this.baseUrl, name);
        return { name, url };
    }

    async dropDatabase(name: string): Promise<void> {
        // Terminate connections and drop
        await query(
            this.adminUrl,
            `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`,
            [name],
        );
        await query(this.adminUrl, `DROP DATABASE IF EXISTS ${quoteIdent(name)}`);
    }
}

function quoteIdent(name: string): string {
    return `"${name.replaceAll('"', '""')}"`;
}
