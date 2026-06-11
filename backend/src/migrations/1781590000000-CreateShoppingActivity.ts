import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShoppingActivity1781590000000 implements MigrationInterface {
  name = 'CreateShoppingActivity1781590000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shopping_activity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "householdId" character varying NOT NULL,
        "shoppingListId" uuid,
        "action" character varying NOT NULL,
        "itemName" character varying NOT NULL,
        "listName" character varying,
        "quantity" numeric,
        "unit" character varying,
        "userId" character varying NOT NULL,
        "userName" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shopping_activity" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shopping_activity_household_created" ON "shopping_activity" ("householdId", "createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shopping_activity_household_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shopping_activity"`);
  }
}
