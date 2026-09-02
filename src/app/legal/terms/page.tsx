import { SiteHeader } from '@/ui/SiteHeader';
import { SiteFooter } from '@/ui/SiteFooter';

const SECTIONS = [
  { id: 'scope', title: '一、服务说明' },
  { id: 'apply', title: '二、适用范围' },
  { id: 'nature', title: '三、诊断结论的性质' },
  { id: 'ip', title: '四、知识产权' },
  { id: 'disclaim', title: '五、免责声明' },
  { id: 'change', title: '六、协议变更' },
  { id: 'contact', title: '七、联系我们' },
];

const COPY: Record<string, string> = {
  scope:
    '转型罗盘为你提供基于所填经历的转型方向诊断，包括赛道匹配度、可迁移能力评估与学习路径建议。服务免费、无需注册。',
  apply:
    '本协议在你使用本产品时自动生效。继续使用即表示你已阅读并理解以下条款，包括与隐私政策相关的数据处理方式。',
  nature:
    '诊断结论由 AI 生成，属于辅助参考，不构成职业中介服务、就业承诺或投资建议。是否采纳，请你结合行业实际与专业意见自行判断。',
  ip:
    '产品界面、诊断模型与文档内容的知识产权归运营方所有。你对自己的原始经历数据享有相应权利，并授权我们为生成本次诊断而处理该数据。',
  disclaim:
    '因网络、设备、第三方模型可用性等原因导致的服务中断或结果偏差，我们在法律允许范围内不承担责任。你来料填写越具体，结论越接近真实。',
  change:
    '我们可能根据法规或服务调整修订本协议，重大变更会在产品内公示。继续使用视为接受变更后的条款。',
  contact: '条款相关疑问，可邮件联系 legal@transicompass.com，我们将在 15 个工作日内回复。',
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader showBack />
      <main id="main">
        <div className="container-reading py-8 md:py-12">
          <p className="num text-sm text-meta">最近更新：2026-08-03</p>
          <h1 className="mt-2 text-3xl font-announce tracking-display">用户协议</h1>
          <p className="mt-3 leading-relaxed text-fg-2">
            使用转型罗盘前，请阅读以下条款。它们与隐私政策共同构成你与我们之间的约定。
          </p>

          <details className="mt-6 rounded-md border border-border bg-surface p-4">
            <summary className="cursor-pointer text-base text-fg">目录</summary>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-accent underline underline-offset-4">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </details>

          <div className="mt-8 grid gap-10 lg:grid-cols-[200px_1fr]">
            <aside className="hidden lg:block">
              <nav className="sticky top-[88px] flex flex-col gap-3 text-sm">
                {SECTIONS.map((s) => (
                  <a key={s.id} href={`#${s.id}`} className="text-fg-2 hover:text-accent">
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>

            <article className="flex flex-col gap-8">
              {SECTIONS.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="text-2xl font-announce tracking-heading">{s.title}</h2>
                  <p className="mt-3 leading-relaxed text-fg-2">{COPY[s.id]}</p>
                </section>
              ))}
            </article>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
