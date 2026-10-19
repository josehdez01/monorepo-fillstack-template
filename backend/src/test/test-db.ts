import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { Client } from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { createOrmConfig } from '../../mikro-orm.config.ts';

const quoteIdent = (name: string) => `"${name.replaceAll('"', '""')}"`;

/** Only explicit test URLs are accepted; application databases are never refreshed. */
export class TestDbManager {
    private readonly base: URL;
    private readonly baseName: string;
    private readonly adminUrl: string;
    private templateName?: Promise<string>;

    constructor(databaseUrl = process.env.TEST_DATABASE_URL) {
        if (process.env.NODE_ENV !== 'test' || !databaseUrl) {
            throw new Error(
                'Database tests require NODE_ENV=test and an explicit TEST_DATABASE_URL',
            );
        }
        this.base = new URL(databaseUrl);
        this.baseName = this.base.pathname.slice(1);
        if (!/^[a-zA-Z0-9_]*test[a-zA-Z0-9_]*$/.test(this.baseName) || this.baseName.length > 32) {
            throw new Error('TEST_DATABASE_URL must name a test database (max 32 characters)');
        }
        this.adminUrl = this.url('postgres');
    }
    private url(name: string): string {
        const url = new URL(this.base);
        url.pathname = `/${name}`;
        return url.toString();
    }
    private async admin<T>(fn: (client: Client) => Promise<T>): Promise<T> {
        const client = new Client({
            connectionString: this.adminUrl,
            connectionTimeoutMillis: 5_000,
        });
        try {
            await client.connect();
            return await fn(client);
        } finally {
            await client.end();
        }
    }
    private async fingerprint(): Promise<string> {
        const files = (await readdir(new URL('../../migrations', import.meta.url)))
            .filter((file) => /^Migration.*\.(ts|js)$/.test(file))
            .toSorted();
        const hash = createHash('sha256');
        for (const file of files) {
            hash.update(await readFile(new URL(`../../migrations/${file}`, import.meta.url)));
        }
        return `${this.baseName}_tmpl_${hash.digest('hex').slice(0, 12)}`;
    }
    async ensureTemplate(rebuild = false): Promise<string> {
        const name = await (this.templateName ??= this.fingerprint());
        return this.admin(async (client) => {
            // One database session owns the lock until migration connection cleanup finishes.
            await client.query('select pg_advisory_lock(hashtext($1))', [name]);
            try {
                const exists = await client.query('select 1 from pg_database where datname=$1', [
                    name,
                ]);
                if (exists.rowCount && !rebuild) {
                    return name;
                }
                if (exists.rowCount) {
                    await this.dropDatabase(name);
                }
                await client.query(`create database ${quoteIdent(name)}`);
                try {
                    const orm = await MikroORM.init(createOrmConfig(this.url(name)));
                    try {
                        await orm.migrator.up();
                    } finally {
                        await orm.close(true);
                    }
                } catch (error) {
                    await this.dropDatabase(name);
                    throw error;
                }
                return name;
            } finally {
                await client.query('select pg_advisory_unlock(hashtext($1))', [name]);
            }
        });
    }
    async createEphemeral(): Promise<{ name: string; url: string }> {
        const template = await this.ensureTemplate();
        const name = `${this.baseName}_test_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
        await this.admin((client) =>
            client
                .query(`create database ${quoteIdent(name)} template ${quoteIdent(template)}`)
                .then(() => {}),
        );
        return { name, url: this.url(name) };
    }
    async dropDatabase(name: string): Promise<void> {
        if (
            !name.startsWith(`${this.baseName}_test_`) &&
            !name.startsWith(`${this.baseName}_tmpl_`)
        ) {
            throw new Error('Refusing to drop a database not owned by this test manager');
        }
        await this.admin(async (client) => {
            await client.query(
                'select pg_terminate_backend(pid) from pg_stat_activity where datname=$1 and pid <> pg_backend_pid()',
                [name],
            );
            await client.query(`drop database if exists ${quoteIdent(name)}`);
        });
    }
}
