/**
 * 把 zod 校验失败映射到具体业务错误码。
 *
 * 为什么需要这层：全部映射成 1001 会让前端只能显示「有一处不符合要求」，
 * 用户不知道该改什么。1003 才能给出「还差 N 字」这种可动手的提示。
 * 错误码的粒度直接决定用户能不能自己走出错误状态。
 *
 * 注意：这里只返回 code，不返回 zod 的原始 message——那是英文的，
 * 面向用户的文案统一由 API_CODE_MESSAGE 提供（Spec 7.1 要求不含技术信息）。
 */

import type { ZodError, ZodIssue } from 'zod';

import { API_CODE } from '@/lib/types/codes';
import type { ApiCode } from '@/lib/types/codes';

const LENGTH_ISSUE_CODES = new Set(['too_small', 'too_big']);

/** 长度越界应报 1003 的字段。 */
const LENGTH_GUARDED_FIELDS = new Set(['sanitized_text', 'main_work']);

function isLengthViolation(issue: ZodIssue): boolean {
  const head = issue.path[0];
  return (
    typeof head === 'string' &&
    LENGTH_GUARDED_FIELDS.has(head) &&
    LENGTH_ISSUE_CODES.has(issue.code)
  );
}

/**
 * 隐私授权字段的校验失败要报 1002 而不是 1001，
 * 前端据此高亮勾选框而不是在表单里找红字。
 */
function isConsentViolation(issue: ZodIssue): boolean {
  const head = issue.path[0];
  return head === 'privacy_consent' || head === 'consent';
}

export function mapIssueToCode(error: ZodError): ApiCode {
  const issues = error.issues;
  if (issues.some(isConsentViolation)) return API_CODE.CONSENT_REQUIRED;
  if (issues.some(isLengthViolation)) return API_CODE.TEXT_LENGTH_OUT_OF_RANGE;
  return API_CODE.INVALID_PARAM;
}

/**
 * 长度类错误附带的补充提示。返回 null 表示用默认文案即可。
 * 只暴露「还差多少字」这类用户能据以行动的信息，不暴露字段路径与校验器名。
 */
export function lengthHint(error: ZodError): string | null {
  const issue = error.issues.find(isLengthViolation);
  if (!issue) return null;

  if (issue.code === 'too_small' && 'minimum' in issue) {
    return `内容还不够，请至少填写 ${String(issue.minimum)} 个字。`;
  }
  if (issue.code === 'too_big' && 'maximum' in issue) {
    return `内容超出了 ${String(issue.maximum)} 字上限，请精简后重试。`;
  }
  return null;
}
