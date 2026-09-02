import { NextRequest } from 'next/server';
import { ok } from '@/lib/response';
import { AUTH_DEMO } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 发送手机验证码（Spec /auth/code）。生产能力：需接入短信网关。
 * 演示版（AUTH_DEMO=true）不接短信，仅告知前端走免验证码注册路径。
 */
export async function POST(_req: NextRequest) {
  if (!AUTH_DEMO) {
    return ok({
      enabled: false,
      message: '演示版未启用短信登录；结果保存、分享与留资均无需登录。',
    });
  }
  return ok({ enabled: true, demo: true, message: '演示环境：输入任意 6 位验证码即可完成注册。' });
}
