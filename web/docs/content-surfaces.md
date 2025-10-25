# Content Surfaces 工业矩阵规范（Phase 2）

目标：实现 `content-surfaces` 模块，将文件卡片、列表、骨架屏与动效全部转换为零圆角工业矩阵风格，确保在不同网络/设备下保持可读性、响应性与沉浸感。

优先级：高（Phase 2 核心）

## 实现顺序

1. **矩阵卡片 (`FileCard`)**：构建矩形合金卡片，顶部冷光扫描条、侧边警示铭牌、底部 HUD 信息带。
2. **骨架屏 (`SkeletonCard`)**：渲染硬边骨架条，配合扫描光柱动画，并处理 `prefers-reduced-motion` 降级。
3. **列表容器 (`FileList`)**：提供加载/错误/空态装甲面板、虚拟滚动预留、批量选择（后续阶段）。
4. **数据 hook (`useFiles`)**：通过 `useAdapters()` 接入 mock/real 数据，实现 retry/backoff 策略与错误捕获。
5. **动效层 (`useCardMotion`)**：定义 hover/焦点/按下状态的冷光渐变、震荡噪点，入口使用轻量滑入动画。
6. **演示入口**：在 `placeholders` 中提供 `ContentShowcase` 或增强版 `CategoriesPlaceholder`，便于验证样式。

## 工业设计要点

- **零圆角**：卡片、按钮、骨架横条全部保持直角；转角通过描边、螺栓纹理表现结构感。
- **冷光描边**：使用 `::before` + `::after` 叠加双层描边；hover 时描边亮度 +25%，focus 时附加内阴影。
- **顶部扫描条**：`FileCard` 顶部 6px 冷光条；在 hover/聚焦时加速流动 (`background-position-x` 动画)。
- **信息层**：卡片底部显示文件尺寸、更新时间、类型标签，采用 `font-mono` + 0.12em 字间距。
- **HUD 噪点**：在主插图或预览区域覆盖轻度噪点纹理，低性能模式下可移除。

## 列表状态规范

- **加载**：显示 `SkeletonCard` 网格，使用 `aria-busy="true"`；在屏幕阅读器中朗读“正在装填内容”。
- **空态**：呈现矩形空槽面板，中央显示 `NO DATA` 铭牌 + 操作引导按钮。
- **错误**：渲染红色警示条（左侧 4px），提供「重试」按钮；对屏幕阅读器播报错误信息。
- **成功**：卡片网格支持 3 列（桌面）与 1-2 列（移动），使用 CSS Grid 自动换行。

## 动效与降级

- Hover：卡片整体上浮 2px，描边亮度脉冲；使用 `transform: translateY(-2px)` + box-shadow 组合。
- Focus：显示蓝白色内发光框 + 键盘操作提示（`Enter` 打开 / `R` 重载）。
- 入场：卡片以 60ms 间隔串行出现，采用 `motion-system` 暴露的 `useStaggeredFade`。
- Reduced motion：禁止位移动画，只保留描边亮度变化；骨架停止扫描条动效并保持静态渐变。

## 性能与可访问性

- 提供虚拟滚动扩展接口（Phase 3），保持 `FileList` API 与 `react-virtual` 兼容。
- 图片/缩略图启用 `loading="lazy"`，并在加载前显示噪点矩形占位，以免布局跳动。
- 错误态信息通过 `role="alert"` 暴露；列表容器在加载时设置 `aria-busy`。
- 卡片操作按钮（下载、收藏等）遵守 tabindex 序列，提供工具提示（矩形黑底 + 冷光描边）。

## 依赖文件

- `web/src/modules/content/FileCard.tsx`
- `web/src/modules/content/SkeletonCard.tsx`
- `web/src/modules/content/FileList.tsx`
- `web/src/modules/content/hooks/useCardMotion.ts`
- `web/src/hooks/useFiles.ts`

## 开发注意事项

- 避免在组件内硬编码颜色；所有色值、描边宽度、亮度使用 `theming-tokens` 提供的 CSS 变量。
- Skeleton 动画使用 CSS keyframes + CSS variables 控制速度，确保可由 `motion-system` 统一调制。
- 为 Storybook 或专用 showcase 预留 mock pipeline，可直接使用 `mockAdapter` 数据。

---

完成上述实现后，请在 `web/docs/phase-0-foundation.md` 的实施记录中追加 Phase 2 验证条目，并在 `navigation-discovery` 文档中回填与列表交互相关的约束（如批量选择）。
