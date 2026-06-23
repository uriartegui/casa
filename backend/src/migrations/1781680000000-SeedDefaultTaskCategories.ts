import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultTaskCategories1781680000000 implements MigrationInterface {
  name = 'SeedDefaultTaskCategories1781680000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "task_categories" ("householdId", "name", "position")
      SELECT households.id, defaults.name, defaults.position
      FROM "households" households
      CROSS JOIN (
        VALUES
          ('Limpeza', 0),
          ('Cozinha', 1),
          ('Banheiro', 2),
          ('Lavanderia', 3),
          ('Manutencao', 4),
          ('Compras', 5),
          ('Organizacao', 6),
          ('Outros', 7)
      ) AS defaults(name, position)
      WHERE NOT EXISTS (
        SELECT 1 FROM "task_categories" categories WHERE categories."householdId" = households.id
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "task_categories"
      WHERE "name" IN ('Limpeza', 'Cozinha', 'Banheiro', 'Lavanderia', 'Manutencao', 'Compras', 'Organizacao', 'Outros')
    `);
  }
}
