import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHomeWideStorages1781600000000 implements MigrationInterface {
  name = 'AddHomeWideStorages1781600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "storages" ("householdId", "name", "emoji")
      SELECT h."id"::text, defaults."name", defaults."emoji"
      FROM "households" h
      CROSS JOIN (
        VALUES
          ('Limpeza', chr(129533)),
          ('Banheiro', chr(128705)),
          ('Lavanderia', chr(129530))
      ) AS defaults("name", "emoji")
      WHERE NOT EXISTS (
        SELECT 1 FROM "storages" s
        WHERE s."householdId" = h."id"::text AND s."name" = defaults."name"
      )
    `);

    await queryRunner.query(`
      INSERT INTO "household_categories" ("householdId", "storageId", "label", "emoji")
      SELECT s."householdId", s."id"::text, defaults."label", defaults."emoji"
      FROM "storages" s
      JOIN (
        VALUES
          ('Limpeza', 'Limpeza geral', chr(129533)),
          ('Limpeza', 'Cozinha', chr(127869) || chr(65039)),
          ('Limpeza', 'Lixo & Sacos', chr(128465) || chr(65039)),
          ('Banheiro', 'Higiene pessoal', chr(129524)),
          ('Banheiro', 'Papel & Algodao', chr(129531)),
          ('Banheiro', 'Cabelo', chr(129524)),
          ('Lavanderia', 'Roupas', chr(129530)),
          ('Lavanderia', 'Passadoria', chr(128085))
      ) AS defaults("storageName", "label", "emoji")
        ON defaults."storageName" = s."name"
      WHERE NOT EXISTS (
        SELECT 1 FROM "household_categories" c
        WHERE c."householdId" = s."householdId"
          AND c."storageId" = s."id"::text
          AND c."label" = defaults."label"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SELECT 1');
  }
}
