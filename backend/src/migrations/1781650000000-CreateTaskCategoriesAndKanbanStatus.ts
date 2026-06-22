import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateTaskCategoriesAndKanbanStatus1781650000000 implements MigrationInterface {
  name = 'CreateTaskCategoriesAndKanbanStatus1781650000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "task_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" character varying NOT NULL, "name" character varying NOT NULL, "position" integer NOT NULL DEFAULT 0, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_task_categories" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_task_categories_household_position" ON "task_categories" ("householdId", "position")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`DROP TABLE IF EXISTS "task_categories"`); }
}
