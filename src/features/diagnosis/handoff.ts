/**
 * 落地页 → 诊断页的请求体交接。
 *
 * 为什么用 sessionStorage 而不是 query string / 全局 store：
 *  - 请求体含数千字文本，放 URL 会超长且会被微信分享卡片带出去；
 *  - 诊断页可能被用户刷新，纯内存 store 一刷即失，交接必须能跨一次导航存活；
 *  - sessionStorage 随标签页关闭即销毁，且这里存的已是脱敏后文本，不落任何 PII。
 * 读取即销毁（takeHandoff），避免用户回退到诊断页时重复触发一次真实的模型调用。
 */

import type { DiagnosisRequest } from '@/lib/types/api';

const HANDOFF_KEY = 'tsc:diagnosis:pending';

export function putHandoff(request: DiagnosisRequest): boolean {
  try {
    window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(request));
    return true;
  } catch {
    // 隐私模式 / 存储配额耗尽
    return false;
  }
}

export function takeHandoff(): DiagnosisRequest | null {
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(HANDOFF_KEY);
    return JSON.parse(raw) as DiagnosisRequest;
  } catch {
    return null;
  }
}

export function clearHandoff(): void {
  try {
    window.sessionStorage.removeItem(HANDOFF_KEY);
  } catch {
    // 无存储权限时无需处理
  }
}
