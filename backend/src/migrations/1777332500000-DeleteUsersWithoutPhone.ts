import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteUsersWithoutPhone1777332500000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Cast both sides to text to handle mixed varchar/uuid column types across tables

    // Phase A: delete all data inside households owned by users without phone
    await queryRunner.query(`
      DELETE FROM fridge_activity
      WHERE "householdId"::text IN (
        SELECT id::text FROM households
        WHERE "ownerId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
      )
    `);
    await queryRunner.query(`
      DELETE FROM fridge_items
      WHERE "householdId"::text IN (
        SELECT id::text FROM households
        WHERE "ownerId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
      )
    `);
    await queryRunner.query(`
      DELETE FROM shopping_items
      WHERE "householdId"::text IN (
        SELECT id::text FROM households
        WHERE "ownerId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
      )
    `);
    await queryRunner.query(`
      DELETE FROM shopping_lists
      WHERE "householdId"::text IN (
        SELECT id::text FROM households
        WHERE "ownerId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
      )
    `);
    await queryRunner.query(`
      DELETE FROM storages
      WHERE "householdId"::text IN (
        SELECT id::text FROM households
        WHERE "ownerId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
      )
    `);
    await queryRunner.query(`
      DELETE FROM household_invites
      WHERE "householdId"::text IN (
        SELECT id::text FROM households
        WHERE "ownerId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
      )
    `);
    await queryRunner.query(`
      DELETE FROM household_members
      WHERE "householdId"::text IN (
        SELECT id::text FROM households
        WHERE "ownerId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
      )
    `);
    await queryRunner.query(`
      DELETE FROM households WHERE "ownerId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
    `);

    // Phase B: delete orphan references created by these users in other households
    await queryRunner.query(`
      DELETE FROM fridge_items WHERE "createdById"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
    `);
    await queryRunner.query(`
      DELETE FROM shopping_items WHERE "createdById"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
    `);
    await queryRunner.query(`
      DELETE FROM shopping_lists WHERE "createdById"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
    `);
    await queryRunner.query(`
      DELETE FROM household_members WHERE "userId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
    `);

    // Phase C: delete auth data and the users themselves
    await queryRunner.query(`
      DELETE FROM refresh_tokens WHERE "userId"::text IN (SELECT id::text FROM users WHERE phone IS NULL)
    `);
    await queryRunner.query(`DELETE FROM users WHERE phone IS NULL`);

    await queryRunner.query(`ALTER TABLE users ALTER COLUMN phone SET NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN phone DROP NOT NULL`);
  }
}
