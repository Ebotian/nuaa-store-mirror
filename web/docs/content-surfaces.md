# Content Surfaces（Phase 2）

目标：实现 `content-surfaces` 模块，包括文件卡片、列表视图、基础动效与骨架屏，保证在不同网络与设备条件下的可用性与性能。

优先级：高（Phase 2 核心）

实现顺序（推荐）

1. Token-driven 基础卡片（`FileCard`）——用 CSS 变量驱动颜色与阴影，响应式布局。
2. 骨架屏（`SkeletonCard`）——轻量、可复用的骨架组件，支持 shimmer 动效和 reduced-motion 降级。
3. 列表容器（`FileList`）——支持虚拟滚动（后置）、占位/加载状态、错误与空态。
4. 数据 hook（`useFiles`）——封装 `useQuery`，使用 `useAdapters()` 从 `data-adapters` 拉取数据。
5. 基础动效与交互（`useCardMotion`）——hover/焦点/按下的视觉反馈、入场动画。
6. 轻量示例页面（可选）——在 `placeholders` 中挂载一个 `CategoriesPlaceholder` 的改进版用于快速验证。

验收标准

- `FileCard` 在窄/宽屏下布局合理，使用 token 变量（例如 `--surface-elevated`, `--shadow-card`）
- `SkeletonCard` 具有 shimmer 动效，且在 `prefers-reduced-motion` 时禁用动画
- `FileList` 使用 `useFiles`，展示加载/错误/空状态
- 动效遵循 `MotionProvider` 的 `parallaxEnabled` 和系统 `prefers-reduced-motion`

性能与无障碍

- 使用 `aria-busy`/`role=status` 报告加载状态
- 列表尽可能使用虚拟滚动（`react-virtual`）以支持超大数据集（后续任务）
- 图片/缩略图采用 lazy-loading，并提供占位色块以减少布局抖动

文件列表

- `web/src/modules/content/FileCard.tsx`
- `web/src/modules/content/SkeletonCard.tsx`
- `web/src/modules/content/FileList.tsx`
- `web/src/hooks/useFiles.ts`

开发注意事项

- 遵循设计 tokens，避免在组件中硬编码颜色与阴影
- 骨架动画使用 CSS Keyframes 并以 `prefers-reduced-motion` 做降级
- 提供 mock 数据支持（`mockAdapter`）以便在 Storybook 中预览

---

完成以上内容后，请在 `web/docs/phase-0-foundation.md` 的实施记录中追加 Phase 2 的验证条目。
