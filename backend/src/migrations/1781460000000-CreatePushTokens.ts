import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushTokens1781460000000 implements MigrationInterface {
  name = 'CreatePushTokens1781460000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "push_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "token" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_push_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_push_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_push_tokens_userId" ON "push_tokens" ("userId")
    `);
    await queryRunner.query(`
      ALTER TABLE "push_tokens"
      ADD CONSTRAINT "FK_push_tokens_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      INSERT INTO "push_tokens" ("userId", "token")
      SELECT "id", "pushToken" FROM "users"
      WHERE "pushToken" IS NOT NULL
      ON CONFLICT ("token") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "push_tokens" DROP CONSTRAINT IF EXISTS "FK_push_tokens_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_push_tokens_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_tokens"`);
  }
}
