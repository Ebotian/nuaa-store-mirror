# Data Adapters 设计文档

目标：定义 `data-adapters`（`services/adapters`）的接口约定、缓存策略与错误处理规范，便于前端与 Fastify 后端稳定对接。

优先级：中（Phase 1 需要基础 API）

实现顺序：

1. 定义通用 HTTP 客户端（fetch/axios 封装）——包含超时、重试、清晰错误类型
2. 定义 `createAdapter(baseUrl)` 工厂，返回资源方法集合（`categories`, `files`, `search`）
3. 用 `react-query` 封装请求与缓存 key（建议 staleTime: 5min, cacheTime: 30min）
4. 约定错误模型：{ code: string, message: string, details?: any }
5. 支持 mock adapter 以便 Storybook 与本地开发

契约示例：

- `fetchCategories(): Promise<Category[]>`
- `fetchFiles(categoryId: string, opts?: FetchOpts): Promise<File[]>`
- `fetchFileDetail(fileId: string): Promise<FileDetail>`

安全与重试：

- 对 5xx 错误采用指数退避重试（最多 2 次）
- 对 429 适配 `Retry-After` header

验收条件：

- 提供 `services/adapters/index.ts` 暴露 `createAdapter` 与 `mockAdapter`。
- `src/app/providers/AppProviders.tsx` 将 `QueryClient` 初始化并可被页面使用。
- 至少实现 `categories` 与 `files` 两个示例接口并在 Storybook/mock 页面可以调用。
