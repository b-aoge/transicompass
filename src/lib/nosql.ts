/**
 * CloudBase 文档数据库（NoSQL / flexdb）初始化封装。
 *
 * 用途：注册用户的诊断免费额度持久化，实现「按注册人跨设备累计、每 30 天 9 次」。
 * 选择 NoSQL 是因为当前 CloudBase 环境未开通可用 PostgreSQL 外网地址（共享集群无连接能力），
 * 而 NoSQL 文档数据库可由云托管容器通过 @cloudbase/node-sdk 直接访问同一环境实例。
 *
 * 凭证获取优先级：
 *   1. 环境变量 TCB_SECRET_ID + TCB_SECRET_KEY（推荐：控制台 API 密钥创建后注入服务环境变量）
 *   2. 云托管运行环境自动注入的临时凭证（仅当服务已绑定本环境）
 */

import cloudbase from '@cloudbase/node-sdk';

let _app: ReturnType<typeof cloudbase.init> | null = null;

function envId(): string {
  return process.env.TCB_ENV || process.env.CLOUDBASE_ENV_ID || '';
}

export function getCloudBaseApp() {
  if (_app) return _app;
  const env = envId();
  if (!env) {
    throw new Error('[nosql] 缺少 TCB_ENV 环境变量，无法连接 CloudBase 文档数据库');
  }
  const opts: Record<string, unknown> = { env };
  const sid = process.env.TCB_SECRET_ID;
  const skey = process.env.TCB_SECRET_KEY;
  if (sid && skey) {
    opts.secretId = sid;
    opts.secretKey = skey;
  }
  _app = cloudbase.init(opts as Parameters<typeof cloudbase.init>[0]);
  return _app;
}

export function getDb() {
  return getCloudBaseApp().database();
}

/** 是否已配置 NoSQL 访问（有 TCB_ENV 即视为可用）。 */
export function nosqlEnabled(): boolean {
  return envId().length > 0;
}
