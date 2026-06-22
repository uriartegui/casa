import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixHouseTaskUserIdsUuid1781670000000 implements MigrationInterface {
  name = 'FixHouseTaskUserIdsUuid1781670000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "house_tasks" ALTER COLUMN "createdById" TYPE uuid USING "createdById"::uuid`);
    await queryRunner.query(`ALTER TABLE "house_tasks" ALTER COLUMN "completedById" TYPE uuid USING NULLIF("completedById", '')::uuid`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "house_tasks" ALTER COLUMN "completedById" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "house_tasks" ALTER COLUMN "createdById" TYPE character varying`);
  }
}
