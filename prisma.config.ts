import path from 'node:path';

import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 必需的配置文件（Spec 5.3 目录结构）。
 * Prisma 7 起不再自动读取 .env，本地开发用 `node --env-file=.env` 或由容器注入环境变量。
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
});
