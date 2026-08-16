// 转型罗盘 TransiCompass — Apple 风格视觉稿生成器
// 基于 DESIGN.md 设计令牌。仅生成本地 mockup，不触碰部署代码。
const fs = require('fs');
const path = require('path');
const OUT = __dirname;

const TOKENS = `
:root{
  --ink:#1d1d1f; --mid:#707070; --nav:#474747; --hair:#d6d6d6;
  --canvas:#f5f5f7; --paper:#ffffff; --wash:#e8e8ed; --faded:#fafafc;
  --blue:#0071e3; --link:#0066cc; --ember:#b64400;
  --r-card:28px; --r-btn:980px; --r-link:10px; --r-badge:36px;
  --maxw:1200px;
  --sf-d:'SF Pro Display',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --sf-t:'SF Pro Text',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body{font-family:var(--sf-t);color:var(--ink);background:var(--paper);line-height:1.47}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 40px}
.band{padding:120px 0}
.band.white{background:var(--paper)}
.band.gray{background:var(--canvas)}
.eyebrow{font-family:var(--sf-t);font-weight:400;font-size:17px;color:var(--mid);letter-spacing:-0.022em}
.brand-mark{font-family:var(--sf-d);font-weight:600;font-size:28px;color:var(--ink);letter-spacing:.08em;text-align:center}
.h-display{font-family:var(--sf-d);font-weight:600;font-size:80px;line-height:1.05;letter-spacing:-1.44px;color:var(--ink)}
.h-hero{font-family:var(--sf-d);font-weight:700;font-size:96px;line-height:1.04;letter-spacing:-1.44px;color:var(--ink)}
.h-sec{font-family:var(--sf-d);font-weight:600;font-size:40px;line-height:1.14;letter-spacing:0.007em;color:var(--ink)}
.h-card{font-family:var(--sf-d);font-weight:600;font-size:28px;line-height:1.2;color:var(--ink)}
.sub{font-family:var(--sf-t);font-weight:400;font-size:21px;line-height:1.4;color:var(--mid);letter-spacing:0.231px;max-width:640px}
.body{font-size:17px;line-height:1.47;color:var(--mid);letter-spacing:-0.022em}
.btn{display:inline-block;background:var(--blue);color:#fff;font-family:var(--sf-t);font-weight:400;font-size:17px;
  padding:11px 22px;border-radius:var(--r-btn);border:none;cursor:pointer;text-decoration:none;letter-spacing:-0.022em}
.btn.ghost{background:transparent;color:var(--ink);border:1px solid rgba(0,0,0,.8)}
.linkarrow{color:var(--link);font-size:17px;text-decoration:none;letter-spacing:-0.022em}
.linkarrow:hover{text-decoration:underline}
.card{background:var(--paper);border-radius:var(--r-card);padding:40px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.badge{display:inline-block;color:var(--ember);font-weight:500;font-size:14px;letter-spacing:0}
.nav{position:sticky;top:0;height:44px;background:var(--faded);backdrop-filter:blur(20px);display:flex;align-items:center;
  justify-content:space-between;padding:0 40px;font-size:12px;color:var(--nav);z-index:10}
.nav .links{display:flex;gap:24px}
.nav .links a{color:var(--nav);text-decoration:none}
.tag{display:inline-block;font-size:12px;color:var(--mid);background:var(--canvas);border-radius:var(--r-badge);padding:6px 14px;margin:4px 6px 4px 0}
.field{margin-bottom:28px}
.field label{display:block;font-size:17px;font-weight:500;color:var(--ink);margin-bottom:10px;letter-spacing:-0.022em}
.field input,.field textarea,.field select{width:100%;font-family:var(--sf-t);font-size:17px;color:var(--ink);
  background:var(--canvas);border:none;border-radius:var(--r-link);padding:14px 16px;outline:none;letter-spacing:-0.022em}
.field textarea{min-height:110px;resize:vertical}
.stepno{font-family:var(--sf-d);font-weight:600;font-size:14px;color:var(--blue);letter-spacing:0.1em}
.pill-row{display:flex;flex-wrap:wrap;gap:8px}
.pill{font-size:14px;color:var(--ink);background:var(--canvas);border-radius:var(--r-badge);padding:8px 16px}
.pill.on{background:var(--ink);color:#fff}
.meter{height:8px;background:var(--wash);border-radius:var(--r-badge);overflow:hidden;margin-top:10px}
.meter > i{display:block;height:100%;background:var(--blue);border-radius:var(--r-badge)}
.timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tl .when{font-family:var(--sf-d);font-weight:600;font-size:21px;color:var(--ink)}
.tl .dur{font-size:14px;color:var(--blue);margin:6px 0 12px}
.foot{background:var(--canvas);padding:48px 0;font-size:12px;color:var(--mid);line-height:1.33}
.foot a{color:var(--link);text-decoration:none}
.radar-wrap{display:flex;justify-content:center;align-items:center;padding:20px 0}
.resume-split{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.resume-split .col h4{font-size:14px;color:var(--mid);font-weight:500;margin-bottom:14px;letter-spacing:0.05em}
.resume-line{font-size:15px;line-height:1.6;color:var(--ink);padding:10px 0;border-bottom:1px solid var(--canvas)}
.resume-line .hl{color:var(--blue)}
`;

function page(title, bodyClass, inner, opts={}) {
  const nav = `<div class="nav"><div class="nav-brand">转型罗盘</div><div class="links"><a>功能</a><a>诊断</a><a>简历</a><a>路径</a><a>登录</a></div></div>`;
  const foot = `<div class="foot"><div class="wrap">转型罗盘 TransiCompass · 面向工程人的 AI 转型助手 · <a>隐私</a> · <a>条款</a></div></div>`;
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=1440">
<title>${title}</title><style>${TOKENS}</style></head>
<body class="${bodyClass}">${opts.noNav? '' : nav}${inner}${foot}</body></html>`;
}

/* ---------- 1. Landing ---------- */
const landing = page('转型罗盘 — 着陆页', '', `
<section class="band white" style="padding-top:140px;text-align:center">
  <div class="wrap">
    <div class="brand-mark">转型罗盘 TransiCompass</div>
    <h1 class="h-hero" style="margin:24px 0 22px">看清你的<br>下一步。</h1>
    <p class="sub" style="margin:0 auto 32px;text-align:center">用 AI 把十一年工程经验，翻译成市场真正认的能力与机会。<br>从背景到路径，四步走完你的转型地图。</p>
    <a class="btn" href="#">开始我的转型诊断</a>
    <p class="body" style="margin-top:18px;color:var(--mid)">约 8 分钟 · 无需注册即可体验</p>
  </div>
</section>

<section class="band gray">
  <div class="wrap">
    <h2 class="h-sec" style="margin-bottom:48px">四步，画完你的转型地图。</h2>
    <div class="grid4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
      ${[
        ['01','背景采集','粘贴简历或回答几个问题，AI 读懂你的真实积累。'],
        ['02','能力诊断','六维能力雷达 + 个性化转型方向推荐。'],
        ['03','简历优化','把工程经验改写为市场语言，突出可迁移能力。'],
        ['04','路径规划','短期 / 中期 / 长期，给出可执行的转型路线。'],
      ].map(([n,t,d])=>`<div class="card"><div class="stepno">${n}</div><div class="h-card" style="margin:14px 0 10px">${t}</div><p class="body">${d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="band white">
  <div class="wrap" style="display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center">
    <div>
      <h2 class="h-sec">不是模板，<br>是懂你行业的诊断。</h2>
      <p class="sub" style="margin:20px 0 24px">多数转型工具把简历当通用文本。转型罗盘理解工程语境——招投标、全周期管理、供应链、甲方对接——再映射到低空经济、储能出海、AI 产品这些真实机会。</p>
      <a class="linkarrow" href="#">看一个诊断样例 ›</a>
    </div>
    <div class="card" style="background:var(--canvas)">
      <div class="body" style="color:var(--ink)">“施工管理 11 年 → 工程咨询 / 低空经济基建”</div>
      <div class="meter" style="margin-top:18px"><i style="width:84%"></i></div>
      <div class="body" style="margin-top:14px;color:var(--mid)">转型适配度 84 · 高于同类背景均值</div>
    </div>
  </div>
</section>
`);

/* ---------- 2. STEP1 背景采集 ---------- */
const step1 = page('STEP1 背景采集', '', `
<section class="band white" style="padding-top:96px">
  <div class="wrap" style="max-width:920px">
    <div class="stepno">STEP 1 / 4</div>
    <h2 class="h-sec" style="margin:12px 0 8px">先讲讲你的现在。</h2>
    <p class="sub">越具体，诊断越准。可以粘贴简历，也可以只回答下面几项。</p>

    <div class="card" style="margin-top:48px">
      <div class="field">
        <label>当前角色</label>
        <div class="pill-row">
          <span class="pill on">施工管理</span><span class="pill">甲方代表</span><span class="pill">乙方经营</span>
          <span class="pill">技术负责</span><span class="pill">项目经理</span><span class="pill">供应链 / 采购</span>
        </div>
      </div>
      <div class="field">
        <label>工作年限</label>
        <input value="11 年（房建 / 市政 / 工业厂房 / 基础设施）">
      </div>
      <div class="field">
        <label>核心能力（可多选）</label>
        <div class="pill-row">
          <span class="pill on">招投标 / 商务报价</span><span class="pill on">供应链与采购</span>
          <span class="pill on">项目全周期管理</span><span class="pill">甲方对接</span>
          <span class="pill on">电力 / 新能源 / 机电</span><span class="pill">团队管理（300+ 人）</span>
        </div>
      </div>
      <div class="field">
        <label>想转的方向（选填）</label>
        <div class="pill-row">
          <span class="pill">低空经济</span><span class="pill">储能出海</span><span class="pill">AI 产品</span>
          <span class="pill">工程咨询</span><span class="pill">项目管理 SaaS</span>
        </div>
      </div>
      <div class="field">
        <label>或粘贴你的简历 / JD</label>
        <textarea placeholder="把简历文本或目标岗位 JD 粘到这里，AI 会自动提取……"></textarea>
      </div>
      <a class="btn" href="#">生成我的能力诊断 →</a>
    </div>
  </div>
</section>
`);

/* ---------- 3. STEP2 诊断 ---------- */
function radar(scores){
  const cx=200, cy=200, R=150, N=scores.length;
  const ang=i=>(-Math.PI/2)+i*2*Math.PI/N;
  const pts=scores.map((s,i)=>[cx+Math.cos(ang(i))*R*s/100, cy+Math.sin(ang(i))*R*s/100]);
  const grid=[]; for(let g=1;g<=4;g++){ const r=R*g/4; let p='';
    for(let i=0;i<N;i++) p+=`${cx+Math.cos(ang(i))*r},${cy+Math.sin(ang(i))*r} `; grid.push(`<polygon points="${p.trim()}" fill="none" stroke="#d6d6d6" stroke-width="1"/>`);}
  const axes=scores.map((s,i)=>`<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(ang(i))*R}" y2="${cy+Math.sin(ang(i))*R}" stroke="#d6d6d6" stroke-width="1"/>`);
  const poly=`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="rgba(0,113,227,.15)" stroke="#0071e3" stroke-width="2"/>`;
  const dots=pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#0071e3"/>`);
  const labels=scores.map((s,i)=>{const lx=cx+Math.cos(ang(i))*(R+26), ly=cy+Math.sin(ang(i))*(R+26);
    return `<text x="${lx}" y="${ly}" font-size="14" font-family="var(--sf-t)" fill="#1d1d1f" text-anchor="middle" dominant-baseline="middle">${s.label}</text>`;});
  return `<svg width="400" height="400" viewBox="0 0 400 400">${grid.join('')}${axes.join('')}${poly}${dots.join('')}${labels.join('')}</svg>`;
}
const dims=[{label:'专业深度',v:85},{label:'管理能力',v:80},{label:'商务能力',v:75},{label:'数字化',v:45},{label:'行业视野',v:70},{label:'转型适配',v:84}];
const step2 = page('STEP2 能力诊断', '', `
<section class="band gray" style="padding-top:96px">
  <div class="wrap">
    <div class="stepno">STEP 2 / 4</div>
    <h2 class="h-sec" style="margin:12px 0 8px">你的能力画像。</h2>
    <p class="sub">基于你的背景，AI 给出六维能力雷达与最匹配的转型方向。</p>

    <div class="grid2" style="margin-top:48px;align-items:stretch">
      <div class="card" style="background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center">
        ${radar(dims)}
        <div class="body" style="margin-top:8px;color:var(--ink)">转型适配度 <b style="color:var(--blue)">84</b> · 高于同类背景均值</div>
      </div>
      <div class="card" style="background:var(--paper)">
        <div class="h-card" style="margin-bottom:20px">推荐转型方向</div>
        ${[
          ['工程咨询 / 全过程咨询','92','你把全周期管理与甲方对接经验，正好对应全过程工程咨询的市场缺口。'],
          ['低空经济 · 基建侧','86','苏州 / 合肥的低空基建与起降点建设，需要懂施工的人。'],
          ['储能出海 · B2B','78','你的供应链与商务能力，可直接迁移到波兰等海外储能渠道。'],
          ['AI 产品经理','64','补上数字化这一维，工程经验就是稀缺的领域知识。'],
        ].map(([t,s,d])=>`<div style="margin-bottom:22px"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="h-card" style="font-size:21px">${t}</span><span style="color:var(--blue);font-weight:600">${s}</span></div><div class="meter"><i style="width:${s}%"></i></div><p class="body" style="margin-top:8px">${d}</p></div>`).join('')}
      </div>
    </div>
    <div style="margin-top:40px"><a class="btn" href="#">优化我的简历 →</a></div>
  </div>
</section>
`);

/* ---------- 4. STEP3 简历优化 ---------- */
const step3 = page('STEP3 简历优化', '', `
<section class="band white" style="padding-top:96px">
  <div class="wrap" style="max-width:1000px">
    <div class="stepno">STEP 3 / 4</div>
    <h2 class="h-sec" style="margin:12px 0 8px">把经验，翻译成市场语言。</h2>
    <p class="sub">AI 识别工程语境里的可迁移能力，改写为目标岗位看得懂的表达。</p>

    <div class="resume-split" style="margin-top:48px">
      <div class="card" style="background:var(--canvas)">
        <h4>原始</h4>
        <div class="resume-line">负责项目施工管理与现场协调。</div>
        <div class="resume-line">对接甲方，处理商务与变更。</div>
        <div class="resume-line">管理 300+ 现场人员与 10+ 班组。</div>
        <div class="resume-line">参与招投标与报价。</div>
      </div>
      <div class="card" style="background:var(--paper)">
        <h4 style="color:var(--blue)">AI 改写 · 面向工程咨询</h4>
        <div class="resume-line"><span class="hl">全过程项目统筹：</span>主导 11 个房建 / 市政项目的计划、成本与交付，按期交付率 100%。</div>
        <div class="resume-line"><span class="hl">客户与干系人管理：</span>作为甲方主要对接人，主导变更与商务谈判，单项目降本约 8%。</div>
        <div class="resume-line"><span class="hl">跨团队领导：</span>统筹 300+ 现场人员与多班组协同，建立标准化现场管理机制。</div>
        <div class="resume-line"><span class="hl">商务拓展：</span>牵头招投标与报价，中标金额累计超 X 亿。</div>
      </div>
    </div>
    <div style="margin-top:36px;display:flex;gap:12px;align-items:center">
      <a class="btn" href="#">生成完整简历 ↓</a>
      <span class="body" style="color:var(--mid)">可切换目标方向：工程咨询 · 低空经济 · 储能出海</span>
    </div>
  </div>
</section>
`);

/* ---------- 5. STEP4 路径规划 ---------- */
const step4 = page('STEP4 路径规划', '', `
<section class="band gray" style="padding-top:96px">
  <div class="wrap">
    <div class="stepno">STEP 4 / 4</div>
    <h2 class="h-sec" style="margin:12px 0 8px">你的转型路线图。</h2>
    <p class="sub">按可落地程度，拆成短期 / 中期 / 长期三段。</p>

    <div class="timeline" style="margin-top:48px">
      ${[
        ['短期 · 0–6 月','补短板','数字化 + 行业视野','补完 PMP / 全过程咨询认证；用业余项目熟悉低空经济基建政策与玩家。'],
        ['中期 · 6–18 月','做迁移','工程咨询 / 低空基建','以内审 / 咨询顾问切入，把施工管理经验落到咨询与基建侧岗位。'],
        ['长期 · 18 月+','立方向','储能出海 B2B','借助供应链与商务底子，对接波兰等海外市场，做渠道或产品。'],
      ].map(([w,d,t,desc])=>`<div class="card" style="background:var(--paper)"><div class="tl"><div class="when">${w}</div><div class="dur">${d}</div><div class="h-card" style="font-size:21px;margin-bottom:12px">${t}</div><p class="body">${desc}</p></div></div>`).join('')}
    </div>
    <div style="margin-top:40px;display:flex;gap:12px;align-items:center">
      <a class="btn" href="#">导出我的转型方案包 ↓</a>
      <a class="linkarrow" href="#">保存进度，下次继续 ›</a>
    </div>
  </div>
</section>
`);

fs.writeFileSync(path.join(OUT,'landing.html'), landing);
fs.writeFileSync(path.join(OUT,'step1.html'), step1);
fs.writeFileSync(path.join(OUT,'step2.html'), step2);
fs.writeFileSync(path.join(OUT,'step3.html'), step3);
fs.writeFileSync(path.join(OUT,'step4.html'), step4);
console.log('written: landing, step1-4 html');
