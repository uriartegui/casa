import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShoppingListToHouseTasks1781690000000 implements MigrationInterface {
  name = 'AddShoppingListToHouseTasks1781690000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "house_tasks" ADD COLUMN IF NOT EXISTS "shoppingListId" uuid');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_house_tasks_shopping_list" ON "house_tasks" ("shoppingListId")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_house_tasks_shopping_list"');
    await queryRunner.query('ALTER TABLE "house_tasks" DROP COLUMN IF EXISTS "shoppingListId"');
  }
}
