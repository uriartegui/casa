import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFridgeActivityDetails1781580000000 implements MigrationInterface {
  name = 'AddFridgeActivityDetails1781580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fridge_activity" ADD COLUMN IF NOT EXISTS "storageName" character varying`);
    await queryRunner.query(`ALTER TABLE "fridge_activity" ADD COLUMN IF NOT EXISTS "storageEmoji" character varying`);
    await queryRunner.query(`ALTER TABLE "fridge_activity" ADD COLUMN IF NOT EXISTS "details" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fridge_activity" DROP COLUMN IF EXISTS "details"`);
    await queryRunner.query(`ALTER TABLE "fridge_activity" DROP COLUMN IF EXISTS "storageEmoji"`);
    await queryRunner.query(`ALTER TABLE "fridge_activity" DROP COLUMN IF EXISTS "storageName"`);
  }
}
