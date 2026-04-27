import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFromShoppingListToFridgeActivity1777320500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fridge_activity"
      ADD COLUMN IF NOT EXISTS "fromShoppingListName" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fridge_activity"
      DROP COLUMN IF EXISTS "fromShoppingListName"
    `);
  }
}
