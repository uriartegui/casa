import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryToShoppingItems1781450000000 implements MigrationInterface {
  name = 'AddCategoryToShoppingItems1781450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shopping_items" ADD COLUMN IF NOT EXISTS "category" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shopping_items" DROP COLUMN IF EXISTS "category"`,
    );
  }
}
