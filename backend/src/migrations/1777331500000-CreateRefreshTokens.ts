import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokens1777331500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
        "token"       text          NOT NULL,
        "tokenPrefix" varchar(8)    NOT NULL,
        "userId"      uuid          NOT NULL,
        "expiresAt"   timestamptz   NOT NULL,
        "revokedAt"   timestamptz,
        "createdAt"   timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_prefix" ON "refresh_tokens" ("tokenPrefix")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}
