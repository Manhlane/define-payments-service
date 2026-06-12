import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugToPaymentIntents20260612120000 implements MigrationInterface {
  name = 'AddSlugToPaymentIntents20260612120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_intents"
      ADD COLUMN IF NOT EXISTS "slug" VARCHAR;
    `);
    await queryRunner.query(`
      UPDATE "payment_intents"
      SET "slug" = substring(md5("id"::text), 1, 6)
      WHERE "slug" IS NULL OR "slug" = '';
    `);
    await queryRunner.query(`
      ALTER TABLE "payment_intents"
      ALTER COLUMN "slug" SET NOT NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_intents_slug"
      ON "payment_intents" ("slug");
    `);
    await queryRunner.query(`
      ALTER TABLE "payment_intents"
      DROP COLUMN IF EXISTS "providerSlug";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_payment_intents_slug";
    `);
    await queryRunner.query(`
      ALTER TABLE "payment_intents"
      DROP COLUMN IF EXISTS "slug";
    `);
  }
}
