import { Card } from '@/ui/Card';
import { Skeleton, SkeletonText, SkeletonRegion } from '@/ui/Skeleton';

const STEPS = ['解析经历', '提取可迁移能力', '匹配目标赛道', '生成学习路径'];

/**
 * 诊断进行中骨架（对应 §10.2 四步清单）。
 * 骨架形状必须预告真实结构：左侧状态位 + 右侧步骤名，首行带子信息占位。
 */
export function DiagnosisLoading() {
  return (
    <SkeletonRegion label="诊断进行中" className="container-reading py-16">
      <Card className="divide-y divide-border-soft">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-3 p-4">
            <Skeleton className="h-5 w-5 rounded-pill" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-28" />
              {i === 0 && <Skeleton className="mt-2 h-3 w-40" />}
            </div>
          </div>
        ))}
      </Card>
      <div className="mt-4 flex justify-center">
        <Skeleton className="h-3 w-48" />
      </div>
    </SkeletonRegion>
  );
}

/**
 * 诊断结果页骨架（对应 §10.3 长文档结构）：
 * 顶部匹配卡 + 三条赛道卡 + 能力块 + 学习路径。按真实块划分，避免通用灰条。
 */
export function ReportResultSkeleton() {
  return (
    <SkeletonRegion label="诊断结果加载中" className="container-reading py-8 md:py-12">
      {/* 顶部匹配概览卡 */}
      <Card className="mb-6">
        <Skeleton className="h-4 w-24" />
        <div className="mt-3 flex items-end gap-3">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
        <SkeletonText lines={2} className="mt-4" />
      </Card>

      {/* 三条赛道卡 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-2 w-full rounded-xs" />
            <SkeletonText lines={2} className="mt-3" />
          </Card>
        ))}
      </div>

      {/* 能力块 */}
      <Card className="mb-6">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-sm" />
          ))}
        </div>
      </Card>

      {/* 学习路径 */}
      <Card>
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-sm" />
          ))}
        </div>
      </Card>
    </SkeletonRegion>
  );
}
