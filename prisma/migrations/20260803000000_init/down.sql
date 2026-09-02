-- 回滚脚本（每份迁移必须可回滚）。
-- Prisma Migrate 不自动执行本文件，需要回滚时手工 psql -f 执行。

DROP TABLE IF EXISTS "rate_counters";
DROP TABLE IF EXISTS "auth_challenges";
DROP TABLE IF EXISTS "fallback_jobs";
DROP TABLE IF EXISTS "events";
DROP TABLE IF EXISTS "leads";
DROP TABLE IF EXISTS "shares";
DROP TABLE IF EXISTS "results";
DROP TABLE IF EXISTS "sessions";
DROP TABLE IF EXISTS "users";

DROP TYPE IF EXISTS "fallback_status";
DROP TYPE IF EXISTS "lead_status";
DROP TYPE IF EXISTS "cta_type";
DROP TYPE IF EXISTS "result_status";
DROP TYPE IF EXISTS "input_type";
