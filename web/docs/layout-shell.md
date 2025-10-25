# Layout Shell 设计文档

目标：定义 `layout-shell` 的响应式策略、TopBar 与 Sidebar 行为、容器断点与交互规范，保证与 `theming-tokens` 和 `motion-system` 无缝协作。

优先级：高（Phase 1 的核心）

实现顺序：

1. 全局容器与断点定义（CSS container queries / Tailwind breakpoints）
2. TopBar 骨架（包含 Title、ThemeToggle、Search 占位）
3. Sidebar/NavigationRail（可折叠、自动隐藏于小屏）
4. 主内容区（带卡片网格占位与浮层 Drawer 支持）
5. 交互说明（键盘、无障碍、焦点管理）

设计细则：

- 布局使用 CSS Grid：两列（导航 | 主内容），在小屏下切换为单列并将导航折叠为底部或抽屉。
- TopBar 固定在顶部，使用 backdrop-filter（支持设备时），并在滚动时调整透明度和阴影。
- Sidebar 支持半折叠(仅图标) 与完全收起状态，切换应有平滑过渡。
- 所有容器使用设计 Tokens（`--surface-base`, `--surface-elevated`, `--surface-divider` 等）以便主题无缝替换。

Accessibility：

- Sidebar toggle 必须可通过键盘访问（Tab + Enter/Space），并带有 aria-expanded。
- 顶栏搜索占位需要 aria-label 与 role="search"。

性能：

- Sidebar 切换与 Drawer 动画使用 `will-change: transform, opacity` 并通过 `requestAnimationFrame` 节流。

示例组件：

- `modules/layout/TopBar.tsx`
- `modules/layout/Sidebar.tsx`
- `modules/layout/LayoutShell.tsx`（导出用于路由包裹的 layout）

验收条件：

- 在大屏下显示侧栏与主内容；在小屏下侧栏折叠为抽屉。
- TopBar 包含主题开关并可通过键盘激活。
- 使用 CSS 变量能在不刷新页面的情况下切换主题并保持布局一致。
