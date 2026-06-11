import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUsersPushToken1781570000000 implements MigrationInterface {
  name = 'DropUsersPushToken1781570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "pushToken"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pushToken" text`);
  }
}
