import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781069643870 implements MigrationInterface {
    name = 'InitialSchema1781069643870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Baseline para ambientes novos. Em bancos criados na era do
        // synchronize:true o schema já existe — apenas registra a migration.
        const exists = await queryRunner.query(`SELECT to_regclass('public.users') AS t`);
        if (exists?.[0]?.t) return;

        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "storages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" character varying NOT NULL, "name" character varying NOT NULL, "emoji" character varying NOT NULL DEFAULT '🧊', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2f2d2fae6dc214f7f3ec52189ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fridge_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" uuid NOT NULL, "storageId" uuid, "name" character varying NOT NULL, "quantity" numeric NOT NULL DEFAULT '1', "unit" character varying, "category" character varying, "expirationDate" date, "createdById" uuid NOT NULL, "fromShoppingListName" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5d6cb39d84fe1b409c4f56d4e16" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "households" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2b1aef2640717132e9231aac756" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "household_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "householdId" uuid NOT NULL, "role" character varying NOT NULL DEFAULT 'member', "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2bb82c0618a5c53b1c8fb5e06ff" UNIQUE ("userId", "householdId"), CONSTRAINT "PK_198055660706bdbea68909fdb01" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "name" character varying NOT NULL, "password" character varying NOT NULL, "pushToken" text, "phone" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shopping_lists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" uuid NOT NULL, "name" character varying NOT NULL, "place" character varying, "category" character varying, "urgent" boolean NOT NULL DEFAULT false, "createdById" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9289ace7dd5e768d65290f3f9de" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shopping_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" uuid NOT NULL, "shoppingListId" uuid, "name" character varying NOT NULL, "quantity" numeric NOT NULL DEFAULT '1', "unit" character varying, "checked" boolean NOT NULL DEFAULT false, "createdById" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_36f295ec7314c9001968ca2c6f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "household_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" uuid NOT NULL, "code" character varying(5) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4dc273129acd034eada7d976d68" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "household_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" character varying NOT NULL, "storageId" character varying NOT NULL, "label" character varying NOT NULL, "emoji" character varying NOT NULL DEFAULT '📦', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e9cb25f9d794ae56f439e274529" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fridge_activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" character varying NOT NULL, "action" character varying NOT NULL, "itemName" character varying NOT NULL, "quantity" numeric, "unit" character varying, "userId" character varying NOT NULL, "userName" character varying, "fromShoppingListName" character varying, "toShoppingListName" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3e0b232b94de9a3d0406792098b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sms_otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "code" character varying NOT NULL, "type" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7ae9322a865d614c41a74734c40" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "tokenPrefix" character varying(8) NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "fridge_items" ADD CONSTRAINT "FK_22426aac127c625718c05a0b290" FOREIGN KEY ("storageId") REFERENCES "storages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fridge_items" ADD CONSTRAINT "FK_fa35a68e38ce240a4ecb1fc6ced" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fridge_items" ADD CONSTRAINT "FK_bbd798b6bff4743fb8b326ebe83" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "households" ADD CONSTRAINT "FK_e9a37d7a2d69fc1a14ed5e8ef67" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "household_members" ADD CONSTRAINT "FK_020bc38c41448c356b962401833" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "household_members" ADD CONSTRAINT "FK_640db19175e32080e5c6b94b6b5" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_lists" ADD CONSTRAINT "FK_9924e299aa59e137cf43e7a4d56" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_lists" ADD CONSTRAINT "FK_ebab2aa00815c9adc11be054c43" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_items" ADD CONSTRAINT "FK_e7b428fcf0ebd70187543a0561d" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_items" ADD CONSTRAINT "FK_344f8b696534369e99b18860e77" FOREIGN KEY ("shoppingListId") REFERENCES "shopping_lists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shopping_items" ADD CONSTRAINT "FK_98abaa1ab61c9c0c3c895fec510" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "household_invites" ADD CONSTRAINT "FK_3ecdc94442e621c4ea5df56c7fb" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`ALTER TABLE "household_invites" DROP CONSTRAINT "FK_3ecdc94442e621c4ea5df56c7fb"`);
        await queryRunner.query(`ALTER TABLE "shopping_items" DROP CONSTRAINT "FK_98abaa1ab61c9c0c3c895fec510"`);
        await queryRunner.query(`ALTER TABLE "shopping_items" DROP CONSTRAINT "FK_344f8b696534369e99b18860e77"`);
        await queryRunner.query(`ALTER TABLE "shopping_items" DROP CONSTRAINT "FK_e7b428fcf0ebd70187543a0561d"`);
        await queryRunner.query(`ALTER TABLE "shopping_lists" DROP CONSTRAINT "FK_ebab2aa00815c9adc11be054c43"`);
        await queryRunner.query(`ALTER TABLE "shopping_lists" DROP CONSTRAINT "FK_9924e299aa59e137cf43e7a4d56"`);
        await queryRunner.query(`ALTER TABLE "household_members" DROP CONSTRAINT "FK_640db19175e32080e5c6b94b6b5"`);
        await queryRunner.query(`ALTER TABLE "household_members" DROP CONSTRAINT "FK_020bc38c41448c356b962401833"`);
        await queryRunner.query(`ALTER TABLE "households" DROP CONSTRAINT "FK_e9a37d7a2d69fc1a14ed5e8ef67"`);
        await queryRunner.query(`ALTER TABLE "fridge_items" DROP CONSTRAINT "FK_bbd798b6bff4743fb8b326ebe83"`);
        await queryRunner.query(`ALTER TABLE "fridge_items" DROP CONSTRAINT "FK_fa35a68e38ce240a4ecb1fc6ced"`);
        await queryRunner.query(`ALTER TABLE "fridge_items" DROP CONSTRAINT "FK_22426aac127c625718c05a0b290"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "sms_otps"`);
        await queryRunner.query(`DROP TABLE "fridge_activity"`);
        await queryRunner.query(`DROP TABLE "household_categories"`);
        await queryRunner.query(`DROP TABLE "household_invites"`);
        await queryRunner.query(`DROP TABLE "shopping_items"`);
        await queryRunner.query(`DROP TABLE "shopping_lists"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "household_members"`);
        await queryRunner.query(`DROP TABLE "households"`);
        await queryRunner.query(`DROP TABLE "fridge_items"`);
        await queryRunner.query(`DROP TABLE "storages"`);
    }

}
