import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueHouseholdMember1777326500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "household_members" ADD CONSTRAINT "UQ_household_member_user_household" UNIQUE ("userId", "householdId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "household_members" DROP CONSTRAINT IF EXISTS "UQ_household_member_user_household"`);
  }
}
