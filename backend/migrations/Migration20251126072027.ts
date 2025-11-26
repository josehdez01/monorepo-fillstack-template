import { Migration } from '@mikro-orm/migrations';

export class Migration20251126072027 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "session" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "session_id" uuid not null, "type" text check ("type" in ('user', 'system')) not null, "ip_address" varchar(255) null, "user_agent" varchar(255) null);`,
        );
        this.addSql(`create index "session_session_id_index" on "session" ("session_id");`);

        this.addSql(
            `create table "user" ("id" serial primary key, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null);`,
        );
        this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);
    }
}
