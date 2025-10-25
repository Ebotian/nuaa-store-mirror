# Navigation & Discovery 模块规范

目标：刻画工业终端风格下的多层级导航体系，覆盖 Sidebar 树、NavigationRail、面包屑/状态条、热键映射，与 `layout-shell`、`content-surfaces`、`motion-system` 的联动。

优先级：高（Phase 1 结束前必须完成）

## 设计原则

- **零圆角 + 分段装甲**：所有导航控件使用矩形面板，边缘添加 1px 冷光描边与内嵌螺栓标记。
- **多层级显隐**：分类树可折叠，选中节点带警示条（左侧 3px 条带，使用 `--accent-warning`）。
- **态势提示**：悬停/焦点态显示 HUD 光晕与编号叠层；选中态添加顶部编号铭牌。
- **空间优化**：在桌面端提供宽版与磁轨（icon-only）双模式；在移动端转为抽屉式指挥面板。

## 架构组件

| 模块              | 文件                                           | 职责                                                 |
| ----------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Sidebar           | `modules/layout/Sidebar.tsx`                   | 渲染树形目录、折叠按钮、搜索入口（可选）。           |
| NavigationRail    | `modules/layout/NavigationRail.tsx`            | 大屏磁轨模式（icon-only），保持与 Sidebar 状态同步。 |
| Breadcrumb HUD    | TODO                                           | 依据当前分类生成装甲铭牌样式的路径指示。             |
| Category adapters | `modules/navigation/useCategoryTree.ts` (待建) | 为 UI 提供树形数据、折叠状态、过滤。                 |

## 状态与交互

### 断点行为

- `lg` ≥ 1024px：默认展开 Sidebar（宽 280px）。用户可折叠为 84px 磁轨，磁轨显示顶级分类图标+编号。
- `md` < 1024px：Sidebar 默认折叠；TopBar 内的「NAV」矩形按钮触发抽屉。
- `sm` < 640px：抽屉改为全屏指挥面板，顶部显示返回按钮和当前路径铭牌。

### 树结构交互

- 键盘：`ArrowRight` 展开、`ArrowLeft` 折叠、`Enter` 选中。需设置 `aria-expanded`、`aria-level`。
- 指示：展开节点左侧警示条延伸至整行；子项显示 `├─` HUD 提示线。
- 懒加载：初期从 mock 数据一次性载入；真实环境可按需在展开时请求。

### 导航同步

- Sidebar、NavigationRail、Breadcrumb 共享 `NavigationContext`（待实现），暴露：
  - `activeCategoryId`
  - `expandedNodeIds`
  - `toggleNode(id)` / `setActive(id)`
- 路由：点击分类跳转 `/categories/:id`，在无真实路由时以 query state 代替。

### 搜索 / 筛选

- 顶栏搜索：输入时在树内高亮匹配节点（淡蓝描边 + 编号高亮），自动展开父级。
- 热键：`⌘/Ctrl + K` 打开全局搜索浮层（Phase 2）。

## 可视化细节

- 行高 44px，使用 12px padding；文字采用 `font-mono` 或 `font-sans` + `tracking-[0.08em]`。
- 图标区域为 38x38 正方形，内部使用 1px 冷光描边，并显示分类代号（如 `F-01`）。
- 悬停：背景色过渡至 `var(--surface-hover)`，描边亮度 +20%。
- 选中：顶部追加 2px 警示条（橙色），右上角显示 `ACTIVE` HUD 标签。

## 无障碍与可读性

- 保证文本与背景对比度 ≥ 4.5:1；悬停/选中需保持可视化差异。
- 为折叠按钮提供 `aria-controls` 指向树容器。
- 抽屉模式在开启时锁定焦点并允许 `Esc` 关闭。

## 动效规范

- 展开/折叠：高度与透明度 180ms ease-out，辅以描边亮度脉冲。
- 选中切换：HUD 标签淡入 120ms，编号文本在 `motion-system` 中触发数字滚动效果。
- 磁轨切换：使用 `translateX` + `clip-path` 模拟装甲板滑动。

## 集成步骤

1. 为分类树编写 `useCategoryTree` hook，管理展开状态与搜索过滤。
2. 将 Sidebar 重构为可接受 `variant="full" | "rail" | "drawer"`，由 `layout-shell` 根据断点控制。
3. 在 `LayoutShell` 中引入 `NavigationContext`，与 `content-surfaces` 联动（点击文件卡更新导航选中）。
4. 预留 Breadcrumb HUD 插槽，后续在 TopBar 下方渲染路径铭牌。

## 验收清单

- Sidebar 在桌面端可折叠为磁轨，移动端转换为抽屉，所有模式均 zero-radius。
- 树节点键盘可访问，选中高亮与警示条一致。
- `/categories/:id` 路由或状态同步正常，TopBar 搜索可定位节点。
- 抽屉开启时焦点锁定，`prefers-reduced-motion` 时所有动画降级为无动效但保留状态提示。
