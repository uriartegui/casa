import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHouseTasks1781620000000 implements MigrationInterface {
  name = 'CreateHouseTasks1781620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "house_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "householdId" character varying NOT NULL,
        "title" character varying NOT NULL,
        "category" character varying,
        "dueDate" date,
        "done" boolean NOT NULL DEFAULT false,
        "createdById" character varying NOT NULL,
        "completedById" character varying,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_house_tasks" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_house_tasks_household_done_due" ON "house_tasks" ("householdId", "done", "dueDate")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_house_tasks_household_done_due"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "house_tasks"`);
  }
}
