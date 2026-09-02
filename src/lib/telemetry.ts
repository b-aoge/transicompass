import pino from 'pino';

/**
 * 结构化日志（pino，Spec §11 可观测性）。
 * 仅本地演示用；生产接入 Loki/CLS 时改 transport 即可。
 * 严禁记录简历原文、IP、完整 UA。
 */
let _logger: pino.Logger | null = null;

export function logger(): pino.Logger {
  if (!_logger) {
    _logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      base: { svc: 'transicompass' },
    });
  }
  return _logger;
}
