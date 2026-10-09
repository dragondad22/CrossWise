-- ADR-009 expand step: users now come from the shared accounts service and have no
-- local password. Backward-compatible (ADR-002): the old code still writes a hash.
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
