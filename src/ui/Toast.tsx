'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

/**
 * Toast —— 轻量操作反馈（「已复制」「数据已删除」）。
 *
 * 只承载**已完成的、不需要用户决策**的反馈。任何需要用户选择的信息
 * 必须走内联错误或弹层，不能塞进 2 秒后就消失的 toast 里。
 *
 * 无障碍：容器常驻 DOM 并挂 role="status" + aria-live="polite"，
 * 这样后插入的文本才会被读屏播报（先有活动区域，后有内容）。
 */
type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const TONE_ICON: Record<ToastTone, IconName> = {
  success: 'CircleCheck',
  error: 'CircleAlert',
  info: 'Info',
};

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-fg-2',
};

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    seq.current += 1;
    const id = seq.current;
    setItems((prev) => [...prev, { id, message, tone }]);
    const timer = window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
    timers.current.push(timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) window.clearTimeout(t);
    };
  }, []);

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-toast flex flex-col items-center gap-2 px-4 pb-safe"
      >
        <div className="flex w-full max-w-[420px] flex-col items-center gap-2 pb-6">
          {items.map((t) => (
            <div
              key={t.id}
              className={cn(
                'animate-rise-in flex items-center gap-2 rounded-md bg-surface px-4 py-3',
                'shadow-overlay text-sm text-fg',
              )}
            >
              <Icon name={TONE_ICON[t.tone]} size="sm" className={TONE_CLASS[t.tone]} />
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * provider 缺失时返回 no-op 而不是抛错：
 * toast 是锦上添花的反馈层，不该因为忘了包 provider 就把整页打崩。
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return ctx ?? { show: () => undefined };
}
