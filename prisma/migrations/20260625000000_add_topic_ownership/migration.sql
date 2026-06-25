-- Add per-user ownership to topics (ADR-001 / #34).
--
-- STRATEGY: pre-launch reset (ADR-002). CrossWise has no real user data yet, so we do
-- NOT backfill existing topics. `ADD COLUMN "user_id" ... NOT NULL` below will fail on a
-- table that already contains rows — that is intentional. Apply this on a fresh database
-- (`prisma migrate deploy` on an empty DB) or reset an existing dev/preview DB with
-- `prisma migrate reset` (which replays all migrations and reseeds with ownership).
-- When real user data exists, supersede this with an expand/contract migration that
-- adds the column nullable, backfills an owner, then tightens to NOT NULL.

-- DropIndex
DROP INDEX "public"."topics_name_key";

-- AlterTable
ALTER TABLE "public"."topics" ADD COLUMN "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "topics_user_id_name_key" ON "public"."topics"("user_id", "name");

-- AddForeignKey
ALTER TABLE "public"."topics" ADD CONSTRAINT "topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
