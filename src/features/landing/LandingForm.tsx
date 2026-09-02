'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Field } from '@/ui/Field';
import { Textarea, LengthHint } from '@/ui/Textarea';
import { Checkbox } from '@/ui/Checkbox';
import { Chip, ChipGroup } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { useToast } from '@/ui/Toast';
import {
  EXPERIENCE_OPTIONS,
  DIRECTION_OPTIONS,
  QUICK_FILL,
  WORK_HINT_MIN,
  WORK_SUBMIT_MIN,
  UPLOAD_MAX_BYTES,
  UPLOAD_ACCEPT,
  type ExperienceValue,
  type DirectionValue,
} from './constants';

interface Errors {
  experience?: string;
  work?: string;
  direction?: string;
  privacy?: string;
}

/**
 * 落地输入主路径。状态覆盖：default / 字段校验错误 / 隐私未勾（抖动+滚动定位）/
 * 上传中 / 解析失败（「改用表单填写」即本页表单，天然不死胡同）/ 提交中。
 */
export function LandingForm() {
  const toast = useToast();
  const [experience, setExperience] = useState<ExperienceValue | ''>('');
  const [work, setWork] = useState('');
  const [direction, setDirection] = useState<DirectionValue | ''>('');
  const [privacy, setPrivacy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const expRef = useRef<HTMLDivElement>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<HTMLDivElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function validate(): Errors {
    const e: Errors = {};
    if (!experience) e.experience = '请选择你的从业年限';
    if (!work.trim()) e.work = '写几句你平时主要做什么，诊断会更准';
    else if (work.trim().length < WORK_SUBMIT_MIN)
      e.work = `再多写一点，至少 ${WORK_SUBMIT_MIN} 个字`;
    if (!direction) e.direction = '选一个想去的方向，或选「我还不知道」';
    if (!privacy) e.privacy = '请勾选同意，我们才能用这段经历生成诊断';
    return e;
  }

  function firstErrorRef(e: Errors): HTMLDivElement | null {
    if (e.experience) return expRef.current;
    if (e.work) return workRef.current;
    if (e.direction) return dirRef.current;
    return privacyRef.current;
  }

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (submitting) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      firstErrorRef(e)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.show(Object.values(e)[0] as string, 'error');
      return;
    }
    // TODO(backend): POST /api/diagnosis { experience, work, direction, source }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      toast.show('（示例）诊断请求已提交，等待结果页接入', 'info');
    }, 1600);
  }

  function handleFile(ev: ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    setUploadError('');
    if (!f) return;
    const okType = /\.(pdf|docx?)$/i.test(f.name);
    if (!okType || f.size > UPLOAD_MAX_BYTES) {
      setUploadError('只支持 PDF / Word，且不超过 10MB');
      toast.show('文件格式或大小不符合要求', 'error');
      return;
    }
    setFileName(f.name);
    // TODO(backend): 浏览器内脱敏后上传解析
    toast.show('（示例）已在浏览器内脱敏，可继续填写', 'info');
  }

  const unknownSelected = direction === 'UNKNOWN';
  const clearErr = (k: keyof Errors) =>
    setErrors((p) => ({ ...p, [k]: undefined }));

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {/* 字段1 · 从业年限（分段选择器） */}
      <div ref={expRef}>
        <Field
          id="experience"
          label="从业年限"
          hint="选一个最接近的区间"
          error={errors.experience}
        >
          <ChipGroup label="从业年限" columns={2}>
            {EXPERIENCE_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                selected={experience === o.value}
                onClick={() => {
                  setExperience(o.value);
                  clearErr('experience');
                }}
              >
                {o.label}
              </Chip>
            ))}
          </ChipGroup>
        </Field>
      </div>

      {/* 字段2 · 主要工作内容 */}
      <div ref={workRef}>
        <Field
          id="work"
          label="主要工作内容"
          error={errors.work}
          aside={<LengthHint value={work} min={WORK_HINT_MIN} />}
        >
          <Textarea
            id="work"
            value={work}
            invalid={!!errors.work}
            onChange={(e) => {
              setWork(e.target.value);
              if (errors.work) clearErr('work');
            }}
            placeholder="例：房建总包项目技术负责人，管过 3 个高层住宅项目，负责施工方案编制、进度计划、分包管理和竣工验收资料"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_FILL.map((q) => (
              <Chip
                key={q.key}
                tone="ghost"
                onClick={() => {
                  setWork(q.text);
                  clearErr('work');
                }}
              >
                {q.label}
              </Chip>
            ))}
          </div>
        </Field>
      </div>

      {/* 字段3 · 想去的方向 */}
      <div ref={dirRef}>
        <Field id="direction" label="想去的方向" error={errors.direction}>
          <ChipGroup label="想去的方向" columns={2}>
            {DIRECTION_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                selected={direction === o.value}
                onClick={() => {
                  setDirection(o.value);
                  clearErr('direction');
                }}
              >
                {o.label}
              </Chip>
            ))}
          </ChipGroup>
          {unknownSelected && (
            <p className="mt-2 text-sm text-meta">没关系，这正是罗盘要回答的。</p>
          )}
        </Field>
      </div>

      {/* 次路径 · 上传简历 */}
      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border-soft" />
        <span className="text-sm text-meta">或者</span>
        <span className="h-px flex-1 bg-border-soft" />
      </div>
      <div>
        <input
          ref={fileRef}
          type="file"
          accept={UPLOAD_ACCEPT}
          className="sr-only"
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          icon="Upload"
          onClick={() => fileRef.current?.click()}
        >
          上传简历（PDF / Word，10MB 内）
        </Button>
        {fileName && !uploadError && (
          <p className="mt-2 flex items-center gap-1 text-sm text-success">
            <Icon name="CircleCheck" size="sm" /> 已选择：{fileName}
          </p>
        )}
        {uploadError && (
          <p className="mt-2 flex items-center gap-1 text-sm text-danger">
            <Icon name="CircleAlert" size="sm" /> {uploadError}
          </p>
        )}
        <p className="mt-2 text-sm text-meta">
          上传后我们会先在你的浏览器里抹掉姓名、电话、身份证和公司名，再送去分析。
        </p>
      </div>

      {/* 隐私授权块（独立、显眼、默认不勾选） */}
      <div ref={privacyRef}>
        <Card
          tone={privacy ? 'wash' : 'default'}
          className={errors.privacy ? 'animate-shake border border-danger' : ''}
        >
          <div className="flex items-start gap-3">
            <Icon name="ShieldCheck" size="md" className="mt-1 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <Checkbox
                id="privacy"
                checked={privacy}
                invalid={!!errors.privacy}
                onChange={(e) => {
                  setPrivacy(e.target.checked);
                  if (e.target.checked) clearErr('privacy');
                }}
                description="我们不会用于模型训练，不会对外提供。数据默认 30 天自动清除，你也可以在结果页随时一键删除。"
              >
                我同意将上述经历用于生成本次诊断
              </Checkbox>
              <p className="mt-3 text-sm text-accent">
                <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-accent-active">
                  隐私政策
                </Link>
                <span className="px-1 text-meta">·</span>
                <Link href="/legal/terms" className="underline underline-offset-4 hover:text-accent-active">
                  用户协议
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 提交（始终 enabled） */}
      <div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          icon="Compass"
          loading={submitting}
          loadingText="正在解析…"
        >
          生成我的转型诊断
        </Button>
        <p className="mt-3 text-center text-xs text-meta">免费 · 无需注册 · 约 30 秒</p>
      </div>
    </form>
  );
}
