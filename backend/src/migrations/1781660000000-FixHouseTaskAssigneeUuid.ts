import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixHouseTaskAssigneeUuid1781660000000 implements MigrationInterface {
  name = 'FixHouseTaskAssigneeUuid1781660000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "house_tasks"
      ALTER COLUMN "assignedToId" TYPE uuid
      USING NULLIF("assignedToId", '')::uuid
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "house_tasks" ALTER COLUMN "assignedToId" TYPE character varying`);
  }
}
