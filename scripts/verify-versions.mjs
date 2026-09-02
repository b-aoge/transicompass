// 依赖版本真实性校验：防止 AI 生成幻觉版本号导致 npm install 失败
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const all = { ...pkg.dependencies, ...pkg.devDependencies };
const names = Object.keys(all);
const results = [];

await Promise.all(
  names.map(async (name) => {
    const url = 'https://registry.npmjs.org/' + name;
    try {
      const r = await fetch(url);
      if (!r.ok) {
        results.push({ name, want: all[name], status: 'REGISTRY_ERR ' + r.status });
        return;
      }
      const j = await r.json();
      const want = all[name];
      const exists = Boolean(j.versions && j.versions[want]);
      const latest = j['dist-tags'] && j['dist-tags'].latest;
      const known = j.versions ? Object.keys(j.versions) : [];
      results.push({ name, want, exists, latest, tail: known.slice(-3) });
    } catch (e) {
      results.push({ name, want: all[name], status: 'FETCH_FAIL ' + e.message });
    }
  })
);

results.sort((a, b) => a.name.localeCompare(b.name));
let bad = 0;
for (const r of results) {
  if (r.status) {
    console.log('[?? ] ' + r.name.padEnd(26) + ' want=' + String(r.want).padEnd(12) + r.status);
    bad++;
    continue;
  }
  if (r.exists) {
    console.log('[ OK] ' + r.name.padEnd(26) + ' want=' + String(r.want).padEnd(12) + ' latest=' + r.latest);
  } else {
    console.log(
      '[BAD] ' + r.name.padEnd(26) + ' want=' + String(r.want).padEnd(12) +
      ' NOT PUBLISHED | latest=' + r.latest + ' | recent=' + r.tail.join(',')
    );
    bad++;
  }
}
console.log('\nTOTAL=' + results.length + '  BAD=' + bad);
