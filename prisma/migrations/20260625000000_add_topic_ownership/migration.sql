-- Add per-user ownership to topics (ADR-001 / #34).
--
-- STRATEGY: expand/backfill/contract (ADR-002). The original version of this migration
-- assumed a pre-launch reset ("no real data yet") and added the column NOT NULL in one
-- step; it failed on the Dev database (23502 — existing topics have no owner) because
-- the DB already holds real accounts and content (#57). The failed attempt rolled back
-- transactionally and was marked rolled back; this rewritten version was never
-- successfully applied anywhere, so editing it in place is safe.
--
-- Existing un-owned topics are backfilled to the earliest-created user account (the
-- instance owner). On a fresh/empty database the backfill is a no-op and the end state
-- is identical. NOTE: a database that has topics but no users cannot satisfy the
-- NOT NULL contract step — that state is unreachable through the app.

-- Expand: add the column nullable
ALTER TABLE "public"."topics" ADD COLUMN "user_id" TEXT;

-- Backfill: assign pre-ownership topics to the earliest-created user account
UPDATE "public"."topics"
SET "user_id" = (SELECT "id" FROM "public"."users" ORDER BY "created_at" ASC LIMIT 1)
WHERE "user_id" IS NULL;

-- Contract: enforce ownership
ALTER TABLE "public"."topics" ALTER COLUMN "user_id" SET NOT NULL;

-- Topic names are now unique per user instead of globally
DROP INDEX "public"."topics_name_key";
CREATE UNIQUE INDEX "topics_user_id_name_key" ON "public"."topics"("user_id", "name");

-- AddForeignKey
ALTER TABLE "public"."topics" ADD CONSTRAINT "topics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
