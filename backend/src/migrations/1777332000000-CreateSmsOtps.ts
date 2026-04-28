import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSmsOtps1777332000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sms_otps" (
        "id"        uuid        NOT NULL DEFAULT gen_random_uuid(),
        "phone"     varchar     NOT NULL,
        "code"      varchar     NOT NULL,
        "type"      varchar     NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "usedAt"    timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sms_otps" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sms_otps_phone_type" ON "sms_otps" ("phone", "type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sms_otps"`);
  }
}
