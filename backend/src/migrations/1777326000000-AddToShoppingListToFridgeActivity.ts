import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddToShoppingListToFridgeActivity1777326000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fridge_activity"
      ADD COLUMN IF NOT EXISTS "toShoppingListName" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fridge_activity"
      DROP COLUMN IF EXISTS "toShoppingListName"
    `);
  }
}
