import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsSchema20260327163000 implements MigrationInterface {
  name = 'CreatePaymentsSchema20260327163000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_intent_status_enum') THEN
          CREATE TYPE "payment_intent_status_enum" AS ENUM ('draft', 'pending', 'partially_paid', 'paid', 'completed', 'disputed');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_schedule_type_enum') THEN
          CREATE TYPE "payment_schedule_type_enum" AS ENUM ('deposit', 'remainder', 'full');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_schedule_status_enum') THEN
          CREATE TYPE "payment_schedule_status_enum" AS ENUM ('pending', 'paid', 'overdue');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type_enum') THEN
          CREATE TYPE "transaction_type_enum" AS ENUM ('charge', 'refund', 'payout');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status_enum') THEN
          CREATE TYPE "transaction_status_enum" AS ENUM ('pending', 'success', 'failed');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status_enum') THEN
          CREATE TYPE "payout_status_enum" AS ENUM ('pending', 'processing', 'paid', 'failed');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status_enum') THEN
          CREATE TYPE "dispute_status_enum" AS ENUM ('open', 'reviewing', 'resolved');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_intents" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "publicId" VARCHAR NOT NULL UNIQUE,
        "userId" UUID NOT NULL,
        "clientName" VARCHAR NOT NULL,
        "clientEmail" VARCHAR NOT NULL,
        "clientPhone" VARCHAR NOT NULL,
        "serviceDescription" TEXT NOT NULL,
        "shootDate" TIMESTAMPTZ NOT NULL,
        "deliveryDate" TIMESTAMPTZ NOT NULL,
        "currency" VARCHAR(3) NOT NULL,
        "totalAmount" NUMERIC(12,2) NOT NULL,
        "status" "payment_intent_status_enum" NOT NULL DEFAULT 'pending',
        "requireDeposit" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_schedules" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "paymentIntentId" UUID NOT NULL,
        "type" "payment_schedule_type_enum" NOT NULL,
        "amount" NUMERIC(12,2) NOT NULL,
        "dueDate" TIMESTAMPTZ NOT NULL,
        "status" "payment_schedule_status_enum" NOT NULL DEFAULT 'pending',
        "paystackReference" VARCHAR,
        "paystackAuthorizationUrl" VARCHAR,
        "paidAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payment_schedules_intent" FOREIGN KEY ("paymentIntentId") REFERENCES "payment_intents"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "paymentIntentId" UUID NOT NULL,
        "paymentScheduleId" UUID NOT NULL,
        "type" "transaction_type_enum" NOT NULL,
        "provider" VARCHAR NOT NULL,
        "reference" VARCHAR NOT NULL UNIQUE,
        "amount" NUMERIC(12,2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL,
        "status" "transaction_status_enum" NOT NULL DEFAULT 'pending',
        "rawResponse" JSONB,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_transactions_intent" FOREIGN KEY ("paymentIntentId") REFERENCES "payment_intents"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transactions_schedule" FOREIGN KEY ("paymentScheduleId") REFERENCES "payment_schedules"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payouts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "paymentIntentId" UUID NOT NULL,
        "userId" UUID NOT NULL,
        "amount" NUMERIC(12,2) NOT NULL,
        "status" "payout_status_enum" NOT NULL DEFAULT 'pending',
        "releasedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payouts_intent" FOREIGN KEY ("paymentIntentId") REFERENCES "payment_intents"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "deliverables" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "paymentIntentId" UUID NOT NULL,
        "title" VARCHAR NOT NULL,
        "type" VARCHAR NOT NULL,
        "quantity" INT NOT NULL,
        CONSTRAINT "FK_deliverables_intent" FOREIGN KEY ("paymentIntentId") REFERENCES "payment_intents"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "disputes" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "paymentIntentId" UUID NOT NULL,
        "reason" TEXT NOT NULL,
        "status" "dispute_status_enum" NOT NULL DEFAULT 'open',
        "createdBy" VARCHAR NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "resolvedAt" TIMESTAMPTZ,
        CONSTRAINT "FK_disputes_intent" FOREIGN KEY ("paymentIntentId") REFERENCES "payment_intents"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "disputes";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "deliverables";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payouts";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_schedules";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_intents";`);

    await queryRunner.query(`DROP TYPE IF EXISTS "dispute_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payout_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_type_enum";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "payment_schedule_status_enum";`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "payment_schedule_type_enum";`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "payment_intent_status_enum";`,
    );
  }
}
