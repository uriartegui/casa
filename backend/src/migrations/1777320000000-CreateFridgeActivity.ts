import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFridgeActivity1777320000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fridge_activity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "householdId" character varying NOT NULL,
        "action" character varying NOT NULL,
        "itemName" character varying NOT NULL,
        "quantity" numeric,
        "unit" character varying,
        "userId" character varying NOT NULL,
        "userName" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fridge_activity" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fridge_activity_householdId"
      ON "fridge_activity" ("householdId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "fridge_activity"`);
  }
}
