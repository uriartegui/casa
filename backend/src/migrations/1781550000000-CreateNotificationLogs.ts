import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationLogs1781550000000 implements MigrationInterface {
  name = 'CreateNotificationLogs1781550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "householdId" character varying NOT NULL,
        "dedupeKey" character varying NOT NULL,
        "itemId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notification_logs_type_dedupe"
      ON "notification_logs" ("type", "dedupeKey")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_logs_household"
      ON "notification_logs" ("householdId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_logs_household"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_logs_type_dedupe"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs"`);
  }
}
