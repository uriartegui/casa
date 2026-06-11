import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceMetadataToPushTokens1781560000000 implements MigrationInterface {
  name = 'AddDeviceMetadataToPushTokens1781560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "push_tokens"
      ADD COLUMN IF NOT EXISTS "platform" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "push_tokens"
      ADD COLUMN IF NOT EXISTS "deviceId" character varying
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_push_tokens_deviceId" ON "push_tokens" ("deviceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_push_tokens_deviceId"`);
    await queryRunner.query(`ALTER TABLE "push_tokens" DROP COLUMN IF EXISTS "deviceId"`);
    await queryRunner.query(`ALTER TABLE "push_tokens" DROP COLUMN IF EXISTS "platform"`);
  }
}
