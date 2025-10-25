# Layout Shell 工业终端规范

目标：为 `layout-shell` 定义硬核工业终端风格的布局骨架，覆盖响应式策略、TopBar/Sidebar 模块化装甲板、主面板容器与战术 HUD 辅助线，确保与 `theming-tokens`、`motion-system`、`navigation-discovery` 协同运作。

优先级：高（Phase 1 核心）

## 设计原则

- **零圆角**：所有面板、按钮、浮层一律保持 0 半径直角切削，呈现装甲板拼缝感。
- **装甲化分区**：导航、主面板、状态面板以矩形钛合金板区隔，辅以编号铭牌、冷光描边、HUD 网格。
- **HUD 辅助**：主容器叠加细网格（8px）与扫描线，配合 `motion-system` 提供的干扰线动画。
- **分段光照**：顶部导航与主面板外侧添加冷色光带 / 警示条纹，通过 CSS 变量驱动亮度。

## 实现顺序

1. **容器网格**：使用 CSS Grid 构建导航列 + 主面板列；在 `lg` 以上固定双列，`md` 以下折叠导航为抽屉。
2. **TopBar 面板**：渲染矩形导航舱面板，包含 Logo 模块、终端编号、矩形搜索仓、主题拨杆。
3. **Sidebar / NavigationRail**：实现可折叠的指挥面板（含分类树），支持全宽/图标模式/抽屉模式三态。
4. **主面板容器**：使用装甲板风格边框 + 叠层描边 + HUD 背板，并预留 Drawer 容器。
5. **交互协议**：定义键盘切换、焦点可视化、低性能降级（禁用动态光带/扫描线）。

## 细节规范

### 容器与断点

- 主容器最大宽度：`max-w-6xl`（可在后续阶段扩展），左右留白 24px。
- 网格定义：`grid-template-columns: 280px 1fr` 在 `lg` 断点以上，`md` 以下改为单列，导航进入抽屉。
- 折叠规则：`lg` 以上可折叠为 84px 图标栏；`md` 以下完全隐藏，由 TopBar 内的按钮触发抽屉。

### TopBar 舱面板

- 背景使用钛合金渐变（由 `--surface-base` 到 `--surface-elevated`），顶部嵌入冷光条 (`::before`) 与铭牌编号 (`TAC-01`)。
- 搜索框为矩形扫描仓：包含放大镜图标、热键提示 (`⌘K`)，输入时触发扫描线动效。
- 滚动交互：监听 `scrollY`，超过 32px 时导航高度从 72px 缩至 56px，并加深阴影描边。

### Sidebar 指挥面板

- 使用矩形装甲板 + 分段边框，当前分类在左侧显示警示条（`--accent-warning`）。
- 展开/折叠动画：磁轨式线性移动（180ms），伴随 HUD 扫描线（淡蓝色渐隐）。
- 抽屉模式：在 `md` 以下通过 `dialog` 或自定义 Portal 呈现，附带背景降亮 (`backdrop-filter: brightness(0.6)`)。

### 主内容舱

- 容器添加双层描边：外层 `border: 1px solid var(--surface-divider)`，内层通过 `::before` 生成冷光描边。
- 背板使用 HUD 网格 (`background-image: linear-gradient(...)`) 与局部光斑 (`radial-gradient`)。
- 预留 Drawer 容器：右侧滑入的详情舱需覆盖 HUD 背板并锁定 body 滚动。

## 无障碍与输入

- Sidebar 折叠按钮提供 `aria-expanded`，并接受 `Enter`/`Space`；抽屉启用 `aria-modal` 和焦点陷阱。
- TopBar 搜索框需暴露 `role="search"`，热键提示可读，例如 `aria-describedby="search-hotkey"`。
- 焦点样式：使用冷光描边 + 内部阴影框，确保高对比度。

## 性能指南

- `will-change` 限定在真正需要的元素（TopBar、Sidebar、Drawer）；动画用 `requestAnimationFrame` 节流。
- 对于低性能设备，通过 `prefers-reduced-motion` 禁用扫描线/闪烁灯带，仅保留描边亮度变化。

## 示例组件

- `modules/layout/TopBar.tsx`
- `modules/layout/Sidebar.tsx`
- `modules/layout/LayoutShell.tsx`
- `modules/layout/NavigationRail.tsx`

## 验收清单

- 桌面端：双列布局，Sidebar 支持折叠与警示条高亮；TopBar 具备冷光条与滚动收缩。
- 移动端：导航以抽屉呈现并具备键盘/屏幕阅读器可访问性，Backdrop 降亮生效。
- HUD 背板、零圆角、描边光带等工业要素在主面板可见；`prefers-reduced-motion` 能正常降级。
