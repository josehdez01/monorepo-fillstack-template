import { Migration } from '@mikro-orm/migrations';

export class Migration20261019000000 extends Migration {
    override async up(): Promise<void> {
        // Existing case-only duplicates intentionally fail the migration rather than dropping user data.
        this.addSql('update "user" set "email" = lower(trim("email"));');
        this.addSql('alter table "session" add column "expires_at" timestamptz not null default now(), add column "revoked_at" timestamptz null;');
        // Existing anonymous tokens expire immediately on migration.
        this.addSql('alter table "session" alter column "expires_at" drop default;');
        this.addSql('drop index if exists "session_session_id_index";');
        this.addSql('alter table "session" add constraint "session_session_id_unique" unique ("session_id");');
        this.addSql('create index "session_expires_at_index" on "session" ("expires_at");');
        this.addSql('alter table "session" alter column "user_agent" type text;');
    }
    override async down(): Promise<void> {
        this.addSql('alter table "session" drop constraint "session_session_id_unique";');
        this.addSql('drop index "session_expires_at_index";');
        this.addSql('alter table "session" drop column "expires_at", drop column "revoked_at";');
        this.addSql('create index "session_session_id_index" on "session" ("session_id");');
        this.addSql('alter table "session" alter column "user_agent" type varchar(255) using left("user_agent", 255);');
    }
}
