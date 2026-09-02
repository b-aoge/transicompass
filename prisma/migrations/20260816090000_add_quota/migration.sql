-- 新增注册用户 / 匿名用户的诊断免费额度字段
-- 注册用户：每 30 天重置为 9 次；匿名用户：按浏览器 sid 默认 3 次

ALTER TABLE "users" ADD COLUMN "remaining_calls" INTEGER NOT NULL DEFAULT 9;
ALTER TABLE "users" ADD COLUMN "quota_reset_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now();

ALTER TABLE "sessions" ADD COLUMN "remaining_calls" INTEGER NOT NULL DEFAULT 3;
