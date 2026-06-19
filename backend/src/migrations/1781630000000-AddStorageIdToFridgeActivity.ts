import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStorageIdToFridgeActivity1781630000000 implements MigrationInterface {
  name = 'AddStorageIdToFridgeActivity1781630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fridge_activity" ADD COLUMN IF NOT EXISTS "storageId" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fridge_activity" DROP COLUMN IF EXISTS "storageId"`);
  }
}
