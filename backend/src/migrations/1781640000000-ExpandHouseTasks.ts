import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandHouseTasks1781640000000 implements MigrationInterface {
  name = 'ExpandHouseTasks1781640000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "house_tasks" ADD COLUMN IF NOT EXISTS "description" text`);
    await queryRunner.query(`ALTER TABLE "house_tasks" ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'pending'`);
    await queryRunner.query(`ALTER TABLE "house_tasks" ADD COLUMN IF NOT EXISTS "assignmentType" character varying NOT NULL DEFAULT 'unassigned'`);
    await queryRunner.query(`ALTER TABLE "house_tasks" ADD COLUMN IF NOT EXISTS "assignedToId" character varying`);
    await queryRunner.query(`ALTER TABLE "house_tasks" ADD COLUMN IF NOT EXISTS "recurrence" character varying NOT NULL DEFAULT 'none'`);
    await queryRunner.query(`ALTER TABLE "house_tasks" ADD COLUMN IF NOT EXISTS "recurrenceIntervalDays" integer`);
    await queryRunner.query(`ALTER TABLE "house_tasks" ADD COLUMN IF NOT EXISTS "reminder" character varying NOT NULL DEFAULT 'none'`);
    await queryRunner.query(`UPDATE "house_tasks" SET "status" = CASE WHEN "done" THEN 'completed' ELSE 'pending' END`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_house_tasks_assigned_due" ON "house_tasks" ("householdId", "assignedToId", "dueDate")`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "house_task_activity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "householdId" character varying NOT NULL,
        "taskId" uuid,
        "action" character varying NOT NULL,
        "taskTitle" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "userName" character varying NOT NULL,
        "details" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_house_task_activity" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_house_task_activity_household_created" ON "house_task_activity" ("householdId", "createdAt")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "house_task_activity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_house_tasks_assigned_due"`);
    await queryRunner.query(`ALTER TABLE "house_tasks" DROP COLUMN IF EXISTS "reminder"`);
    await queryRunner.query(`ALTER TABLE "house_tasks" DROP COLUMN IF EXISTS "recurrenceIntervalDays"`);
    await queryRunner.query(`ALTER TABLE "house_tasks" DROP COLUMN IF EXISTS "recurrence"`);
    await queryRunner.query(`ALTER TABLE "house_tasks" DROP COLUMN IF EXISTS "assignedToId"`);
    await queryRunner.query(`ALTER TABLE "house_tasks" DROP COLUMN IF EXISTS "assignmentType"`);
    await queryRunner.query(`ALTER TABLE "house_tasks" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "house_tasks" DROP COLUMN IF EXISTS "description"`);
  }
}
