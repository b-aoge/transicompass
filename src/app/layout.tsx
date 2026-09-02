import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { ToastProvider } from '@/ui/Toast';

export const metadata: Metadata = {
  title: {
    default: '转型罗盘 · 把工地经验翻译成新赛道听得懂的语言',
    template: '%s · 转型罗盘',
  },
  description:
    '面向房建、市政、机电、基建从业者的转型方向诊断。填三个空，约 30 秒拿到可迁移能力清单、三个赛道的匹配依据和三阶段学习路径。免费，不用注册。',
  applicationName: '转型罗盘',
  // 微信 / iOS 会把连续数字自动识别成电话并染成系统蓝，破坏等宽读数的色阶
  formatDetection: { telephone: false, address: false, email: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 底部安全区（iPhone home indicator）需要它，配合 env(safe-area-inset-bottom)
  viewportFit: 'cover',
  // V1 锁浅色：微信 X5 内核的深色模式会强制反色，把中性色阶和刻度条一起搞坏
  colorScheme: 'light',
  // 刻意不设 maximumScale / userScalable —— 禁用缩放是无障碍红线（WCAG 1.4.4）
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-modal focus:rounded-sm focus:bg-surface focus:px-4 focus:py-3 focus:text-accent focus:shadow-overlay"
        >
          跳到主要内容
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
