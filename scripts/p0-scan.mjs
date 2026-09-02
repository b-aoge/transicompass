/**
 * P0 红线门禁扫描器
 *
 * 为什么不用 emoji 正则：Windows 下 Node/Python 的 \u{...} 范围写法容易把中日韩汉字
 * 误判为 emoji（曾把「转」U+8F6C 报成 emoji），整批文档被误杀。
 * 这里改用逐码点判定，只认真正的 emoji 区段，零误报。
 *
 * 豁免规则依据 ADR-011（CSS 运行期特性兼容闸门）：
 *   - tokens.css / globals.css 的 :root 允许写死 hex（令牌定义源头，C2 例外）
 *   - dvh 不是一律禁止，而是「必须带 vh 回退」，故做规则块级回退校验而非行级封杀
 *   - Markdown 文档只查 emoji：文档里讨论、举例、引用禁令属正常行为，红线管的是代码
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_EXT = new Set([
  '.md', '.mdx', '.yaml', '.yml', '.css', '.json',
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.html', '.prisma',
]);
const SKIP_DIR = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.workbuddy',
]);
// 扫描器自身含全部规则关键字，必须排除，否则自我误报
const SKIP_FILE = new Set(['p0-scan.mjs']);

// 令牌定义源头：允许硬编码 hex、允许出现 dvh 回退层叠、不计行数上限
const TOKEN_FILES = new Set(['tokens.css', 'globals.css']);

const EMOJI_RANGES = [
  [0x1f300, 0x1f5ff], [0x1f600, 0x1f64f], [0x1f680, 0x1f6ff],
  [0x1f900, 0x1f9ff], [0x1fa70, 0x1faff], [0x2600, 0x26ff],
  [0x2700, 0x27bf], [0x1f1e6, 0x1f1ff], [0xfe0f, 0xfe0f], [0x20e3, 0x20e3],
];

function isEmojiCodePoint(cp) {
  for (const [lo, hi] of EMOJI_RANGES) if (cp >= lo && cp <= hi) return true;
  return false;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR.has(entry.name)) continue;
      walk(full, out);
    } else if (SCAN_EXT.has(path.extname(entry.name)) && !SKIP_FILE.has(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const findings = [];
function report(file, line, rule, detail) {
  findings.push({ file: path.relative(ROOT, file), line, rule, detail });
}

const files = walk(ROOT);
const overLong = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/);
  const ext = path.extname(file);
  const base = path.basename(file);
  const isDoc = ['.md', '.mdx'].includes(ext);
  const isCode = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.html'].includes(ext);
  const isTokenFile = TOKEN_FILES.has(base);

  // ---- emoji：所有文件类型都查，这是唯一无差别红线 ----
  lines.forEach((text, i) => {
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (isEmojiCodePoint(cp)) {
        report(file, i + 1, 'EMOJI', 'U+' + cp.toString(16).toUpperCase() + ' ' + ch);
        break;
      }
    }
  });

  // 文档只查 emoji，其余规则仅对代码生效
  if (isDoc || !isCode) continue;

  if (!isTokenFile && lines.length > 300) {
    overLong.push(path.relative(ROOT, file) + ' (' + lines.length + ' 行)');
  }

  lines.forEach((text, i) => {
    const lineNo = i + 1;

    if (/linear-gradient|radial-gradient|conic-gradient/i.test(text)) {
      report(file, lineNo, 'GRADIENT', text.trim().slice(0, 80));
    }

    if (/Lorem ipsum|Welcome to Our App|Sign up today|Your Company Name/i.test(text)) {
      report(file, lineNo, 'AI_BOILERPLATE', text.trim().slice(0, 80));
    }

    if (!isTokenFile) {
      const hex = text.match(/#[0-9a-fA-F]{3,8}\b/g);
      if (hex) {
        const bad = hex.filter((h) => !/^#(fff|ffffff|000|000000)$/i.test(h));
        if (bad.length) report(file, lineNo, 'HARDCODED_COLOR', bad.join(','));
      }
    }

    for (const b of ['color-mix(', '@container', 'oklch(', ':has(']) {
      if (text.includes(b)) report(file, lineNo, 'BANNED_CSS', b);
    }
  });

  // ---- dvh 回退校验（ADR-011）：dvh 允许存在，但同一规则块内必须有 vh 回退 ----
  // 注释行里的禁令说明文字不算违规，需跟踪 /* */ 块状态
  if (ext === '.css') {
    let inComment = false;
    const commentAt = lines.map((text) => {
      const wasIn = inComment;
      const open = text.lastIndexOf('/*');
      const close = text.lastIndexOf('*/');
      if (open > close) inComment = true;
      else if (close > open) inComment = false;
      return wasIn || open !== -1;
    });

    lines.forEach((text, i) => {
      if (commentAt[i]) return;
      const m = text.match(/(min-height|height|max-height)\s*:\s*[\d.]+dvh/);
      if (!m) return;
      const prop = m[1];
      // 回退必须写在 dvh 之前（层叠：老内核取 vh，新内核覆盖为 dvh）
      let hasFallback = false;
      for (let j = i - 1; j >= 0 && j >= i - 6; j--) {
        if (/[{}]/.test(lines[j]) && !new RegExp(prop).test(lines[j])) break;
        if (new RegExp(prop + '\\s*:\\s*[\\d.]+vh').test(lines[j])) { hasFallback = true; break; }
      }
      if (!hasFallback) {
        report(file, i + 1, 'DVH_NO_FALLBACK', text.trim().slice(0, 80));
      }
    });
  }

  // ---- 业务代码里裸用 dvh（非 css 文件，如 tsx 内联样式/className 任意值）----
  if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    lines.forEach((text, i) => {
      if (/\b\d+dvh\b/.test(text)) {
        report(file, i + 1, 'RAW_DVH_IN_TSX', text.trim().slice(0, 80));
      }
    });
  }
}

const byRule = {};
for (const f of findings) (byRule[f.rule] = byRule[f.rule] || []).push(f);

console.log('P0 门禁扫描  |  扫描文件数: ' + files.length + '\n');
const RULES = [
  'EMOJI', 'GRADIENT', 'AI_BOILERPLATE', 'HARDCODED_COLOR',
  'DVH_NO_FALLBACK', 'RAW_DVH_IN_TSX', 'BANNED_CSS',
];
for (const rule of RULES) {
  const hits = byRule[rule] || [];
  console.log('[' + (hits.length === 0 ? 'PASS' : 'FAIL') + '] ' + rule.padEnd(18) + ' 命中 ' + hits.length);
  for (const h of hits.slice(0, 12)) {
    console.log('       ' + h.file + ':' + h.line + '  ' + h.detail);
  }
  if (hits.length > 12) console.log('       ... 另有 ' + (hits.length - 12) + ' 处');
}

console.log('\n[' + (overLong.length === 0 ? 'PASS' : 'WARN') + '] FILE_TOO_LONG      超 300 行代码文件 ' + overLong.length);
for (const f of overLong) console.log('       ' + f);

console.log('\n结论: ' + (findings.length === 0 ? '全部通过' : '存在 ' + findings.length + ' 处违规，需修复'));
process.exit(findings.length === 0 ? 0 : 1);
