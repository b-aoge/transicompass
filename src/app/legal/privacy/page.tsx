import { SiteHeader } from '@/ui/SiteHeader';
import { SiteFooter } from '@/ui/SiteFooter';

const SECTIONS = [
  { id: 'collect', title: '一、我们收集的信息' },
  { id: 'use', title: '二、信息如何使用' },
  { id: 'sanitize', title: '三、浏览器内脱敏' },
  { id: 'store', title: '四、存储与保留' },
  { id: 'not', title: '五、我们不会做什么' },
  { id: 'rights', title: '六、你的权利' },
  { id: 'contact', title: '七、联系我们' },
];

const COPY: Record<string, string> = {
  collect:
    '你主动填写的从业年限、主要工作内容、意向方向；如果你上传简历，我们只在本地读取并解析为文本，不留存原始文件。',
  use: '上述信息仅用于本次转型诊断的生成与展示。我们不将其用于广告投放，也不并入任何通用模型的训练集。',
  sanitize:
    '上传的简历会先在你的浏览器里抹去姓名、电话、身份证号、公司名等可识别信息，只把脱敏后的文本送去分析，原始文件不会离开你的设备。',
  store:
    '诊断数据默认保留 30 天后自动清除。你也可以在结果页随时一键删除，删除后原文与诊断结果会一并清除且不可恢复。',
  not: '我们不会向第三方出售或提供你的原始经历，不会将其用于模型训练，也不会在未经你同意的情况下对外共享。',
  rights:
    '你有权访问、更正和删除自己的数据，也有权随时撤回已作出的授权同意。撤回不影响撤回前已进行的处理。',
  contact: '隐私相关疑问，可邮件联系 privacy@transicompass.com，我们将在 15 个工作日内回复。',
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader showBack />
      <main id="main">
        <div className="container-reading py-8 md:py-12">
          <p className="num text-sm text-meta">最近更新：2026-08-03</p>
          <h1 className="mt-2 text-3xl font-announce tracking-display">隐私政策</h1>
          <p className="mt-3 leading-relaxed text-fg-2">
            转型罗盘是一套面向工程从业者的 AI 转型诊断工具。这份政策说明我们如何处理你提交的信息，以及你拥有哪些权利。
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
