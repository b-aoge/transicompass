-- 转型罗盘 TranSiCompass 初始迁移
-- 对应 prisma/schema.prisma，源自 Spec 6.1 / 6.2。
-- 回滚脚本见同目录 down.sql。

CREATE TYPE "input_type" AS ENUM ('resume', 'form');
CREATE TYPE "result_status" AS ENUM ('completed', 'degraded');
CREATE TYPE "cta_type" AS ENUM ('community', 'consult_1v1');
CREATE TYPE "lead_status" AS ENUM ('new', 'contacted', 'closed');
CREATE TYPE "fallback_status" AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone_hash" TEXT NOT NULL,
    "phone_enc" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ(6),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_phone_hash_key" ON "users" ("phone_hash");

CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "input_type" "input_type" NOT NULL,
    "sanitized_text_enc" BYTEA NOT NULL,
    "sanitize_report" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_sessions_expires_at" ON "sessions" ("expires_at");
CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id");

CREATE TABLE "results" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "user_id" UUID,
    "payload_enc" JSONB NOT NULL,
    "title" VARCHAR(40),
    "model_name" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "status" "result_status" NOT NULL,
    "out_of_scope" BOOLEAN NOT NULL DEFAULT false,
    "saved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_results_session_id" ON "results" ("session_id");
CREATE INDEX "idx_results_user_id_created" ON "results" ("user_id", "created_at" DESC);
CREATE INDEX "idx_results_expires_at" ON "results" ("expires_at");

CREATE TABLE "shares" (
    "id" UUID NOT NULL,
    "result_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "idx_shares_token" ON "shares" ("token");
CREATE INDEX "idx_shares_result_id" ON "shares" ("result_id");
CREATE INDEX "idx_shares_expires_at" ON "shares" ("expires_at");

CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "session_id" UUID,
    "result_id" UUID,
    "cta_type" "cta_type" NOT NULL,
    "contact_enc" BYTEA NOT NULL,
    "contact_hash" TEXT NOT NULL,
    "contact_type" TEXT NOT NULL,
    "source_channel" TEXT,
    "status" "lead_status" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_leads_contact_hash" ON "leads" ("contact_hash");
CREATE INDEX "idx_leads_created_at" ON "leads" ("created_at" DESC);
CREATE INDEX "idx_leads_status" ON "leads" ("status");

CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "session_id" UUID,
    "name" TEXT NOT NULL,
    "props" JSONB,
    "device" TEXT,
    "app_version" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_events_name_time" ON "events" ("name", "occurred_at" DESC);
CREATE INDEX "idx_events_session" ON "events" ("session_id");

CREATE TABLE "fallback_jobs" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "email_enc" BYTEA NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "status" "fallback_status" NOT NULL DEFAULT 'pending',
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "fallback_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_fallback_jobs_status" ON "fallback_jobs" ("status", "created_at");
CREATE INDEX "idx_fallback_jobs_expires_at" ON "fallback_jobs" ("expires_at");

CREATE TABLE "auth_challenges" (
    "id" UUID NOT NULL,
    "phone_hash" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "auth_challenges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "auth_challenges_phone_hash_key" ON "auth_challenges" ("phone_hash");
CREATE INDEX "idx_auth_challenges_expires_at" ON "auth_challenges" ("expires_at");

CREATE TABLE "rate_counters" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "window_end" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "rate_counters_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "idx_rate_counters_window_end" ON "rate_counters" ("window_end");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "results" ADD CONSTRAINT "results_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "results" ADD CONSTRAINT "results_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shares" ADD CONSTRAINT "shares_result_id_fkey"
    FOREIGN KEY ("result_id") REFERENCES "results" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fallback_jobs" ADD CONSTRAINT "fallback_jobs_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
