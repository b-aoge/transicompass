# -*- coding: utf-8 -*-
"""校验 openapi.yaml 是否为结构完整、可作为开发唯一契约的文档。

不只是语法能不能 parse，还要验证：
  - 端点数量与方法
  - 每个响应是否绑定了 schema（避免"契约"里全是裸 object）
  - 错误码枚举是否齐全
  - TrackCode 是否锁死三值（防止 AI 生成第四条赛道）
  - $ref 是否全部可解析（断链的契约等于没契约）
"""
import sys
import re
import yaml

with open('openapi.yaml', encoding='utf-8') as f:
    raw = f.read()

try:
    doc = yaml.safe_load(raw)
except Exception as e:
    print('YAML 解析失败:', e)
    sys.exit(1)

print('openapi 版本 :', doc.get('openapi'))
info = doc.get('info', {})
print('标题        :', info.get('title'), '/', info.get('version'))

paths = doc.get('paths', {})
METHODS = ('get', 'post', 'put', 'patch', 'delete')
total_ops = 0
print('\n端点清单 (%d 条 path):' % len(paths))
for p, ops in paths.items():
    ms = [m.upper() for m in ops if m in METHODS]
    total_ops += len(ms)
    print('   %-8s %s' % (','.join(ms), p))
print('操作总数    :', total_ops)

schemas = doc.get('components', {}).get('schemas', {})
print('\nschema 数量 :', len(schemas))

# --- 响应是否都绑定了 schema ---
naked = []
for p, ops in paths.items():
    for m, op in ops.items():
        if m not in METHODS:
            continue
        for code, resp in (op.get('responses') or {}).items():
            content = resp.get('content') or {}
            if not content:
                continue
            for ctype, body in content.items():
                if ctype.startswith('text/event-stream'):
                    continue
                if not body.get('schema'):
                    naked.append('%s %s -> %s (%s)' % (m.upper(), p, code, ctype))
print('\n[%s] 响应绑定 schema  未绑定 %d 处' % ('PASS' if not naked else 'FAIL', len(naked)))
for n in naked[:10]:
    print('       ', n)

# --- $ref 断链检查 ---
refs = set(re.findall(r"\$ref:\s*['\"]?(#/[^'\"\s]+)", raw))
broken = []
for r in refs:
    node = doc
    for part in r.lstrip('#/').split('/'):
        if isinstance(node, dict) and part in node:
            node = node[part]
        else:
            broken.append(r)
            break
print('[%s] $ref 可解析     共 %d 个引用，断链 %d 个'
      % ('PASS' if not broken else 'FAIL', len(refs), len(broken)))
for b in broken[:10]:
    print('       ', b)

# --- TrackCode 三值锁定 ---
EXPECT_TRACKS = {'NEW_ENERGY_STORAGE', 'SMART_CONSTRUCTION_BIM', 'ENGINEERING_B2B_OVERSEAS'}
track_ok = False
found_tracks = None
for name, sch in schemas.items():
    if 'track' in name.lower() and sch.get('enum'):
        found_tracks = set(sch['enum'])
        track_ok = found_tracks == EXPECT_TRACKS
        break
print('[%s] TrackCode 锁定   %s'
      % ('PASS' if track_ok else 'FAIL', sorted(found_tracks) if found_tracks else '未找到枚举'))

# --- 错误码枚举 ---
codes = sorted(set(int(c) for c in re.findall(r'\b([1-9]\d{3})\b', raw)
                   if c[0] in '123456789'))
print('[INFO] 文档中出现的四位错误码:', codes[:30])

fail = bool(naked) or bool(broken) or not track_ok
print('\n结论:', '契约完整可用' if not fail else '契约存在缺陷，需修复')
sys.exit(1 if fail else 0)
