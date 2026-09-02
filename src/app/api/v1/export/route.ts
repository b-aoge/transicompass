import { NextRequest } from 'next/server';
import { ok, fail, ErrCode } from '@/lib/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 生成 PDF 导出（Spec /export）。生产：服务端 Playwright 渲染 /r/{id}/print。
 * 演示环境未启用无头浏览器，前端降级为浏览器打印（Ctrl/Cmd+P）。
 */
export async function POST(_req: NextRequest) {
  return fail(
    ErrCode.SERVER,
    'PDF 导出需在部署环境启用无头浏览器；当前演示请使用浏览器打印（Ctrl/Cmd+P）。',
    200,
  );
}
