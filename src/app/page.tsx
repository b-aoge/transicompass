import { SiteHeader } from '@/ui/SiteHeader';
import { UploadFlow } from '@/features/diagnosis/UploadFlow';
import { Icon, type IconName } from '@/ui/Icon';
import Link from 'next/link';

const STEPS: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'FileText', title: '贴履历', desc: '粘贴简历正文或上传 PDF/DOCX，浏览器内即时脱敏，原文不上传。' },
  { icon: 'Compass', title: '出诊断', desc: '约 30 秒生成可迁移能力、三条赛道匹配依据与学习路径。' },
  { icon: 'Route', title: '拿路径', desc: '照着三阶段交付物走，把工程经验变成新赛道简历资产。' },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="container-reading py-10 md:py-16">
          <p className="label-caps">工程人转型决策工具</p>
          <h1 className="mt-2">把工地经验，翻译成新赛道听得懂的语言</h1>
          <p className="mt-4 text-lg leading-body text-fg-2">
            填三个空，约 30 秒拿到可迁移能力清单、三条赛道匹配依据与三阶段学习路径。免费，不用注册。
          </p>

          <div className="mt-8">
            <UploadFlow />
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-md bg-surface p-5 shadow-ring">
                <Icon name={s.icon} size="lg" className="text-accent" />
                <h3 className="mt-3 text-lg">{s.title}</h3>
                <p className="mt-1 text-sm leading-body text-muted">{s.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-meta">
            本报告为 AI 辅助参考，不构成职业中介服务、就业承诺或投资建议。生成式 AI
            服务须完成算法备案与登记后方可上线商用。
          </p>
        </section>
        <footer className="border-t border-border bg-surface">
          <div className="container-reading flex flex-col gap-2 py-8 text-sm text-meta">
            <p>转型罗盘 TranSiCompass · 工程人转型决策工具</p>
            <p>
              <Link href="/" className="text-accent hover:underline">
                首页
              </Link>
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
