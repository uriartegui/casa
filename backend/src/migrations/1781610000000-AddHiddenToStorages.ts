import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHiddenToStorages1781610000000 implements MigrationInterface {
  name = 'AddHiddenToStorages1781610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "storages"
      ADD COLUMN IF NOT EXISTS "hidden" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "storages"
      DROP COLUMN IF EXISTS "hidden"
    `);
  }
}
