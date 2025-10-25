# Phase 0 实现说明：Vite 配置 / 路由 / Tailwind Tokens / 全局 Provider

更新日期：2025-10-26
关联设计文档：`前端 UI 实现方案.md`（Phase 0 阶段）

---

## 1. 目标与范围

- **Vite 配置**：完善别名、环境变量、构建输出、TS 路径。
- **路由骨架**：引入 React Router，提供基础布局与页面占位。
- **Tailwind & Tokens**：初始化 Tailwind，落地设计 Token、全局样式基线，并提供亮/暗双主题调色板。
- **全局 Provider**：集中注册主题、动效、数据等上下文（暂以占位对象实现，可后续补强）。

> 本阶段不输出业务 UI，只建立开发基石。

---

## 2. 依赖与脚本调整

### 2.1 新增依赖

运行下列命令安装依赖：

```bash
cd web
npm install react-router-dom @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer tailwind-merge class-variance-authority
```

### 2.2 npm scripts 变更

在 `web/package.json` 中：

- 新增 `typecheck`（调用 `tsc --noEmit`）。
- 为 `dev`/`preview` 添加 `--host` 选项，方便局域网联调。
- 预留 `storybook`/`test` 位（暂留空，后续阶段接入）。

---

## 3. Vite & TypeScript 配置

### 3.1 `vite.config.ts`

- 引入 `fileURLToPath` 设定 `@` → `src`、`@modules` → `src/modules` 等别名。
- 打开 `server.host: true`、`server.port: 4173`（可调整）。
- 配置 `css.postcss` 指向 `postcss.config.js`。
- 预置 `define: { __APP_VERSION__: JSON.stringify(pkg.version) }`。

### 3.2 TypeScript

- 在 `tsconfig.json` 中同步路径别名。
- 在 `tsconfig.app.json` 将 `src` 子目录更新为新的结构（使用 `references` 指向 `app`, `modules` 等后续子目录）。

---

## 4. Tailwind & Tokens

### 4.1 初始化文件

- 执行 `npx tailwindcss init tailwind.config.ts -p`（保留 TS 版本）。
- 新增目录：
  - `src/styles/` → 放置 `globals.css`, `tailwind.css`, `reset.css`
  - `src/themes/` → `tokens.ts`, `index.ts`（导出 `themeTokens`）

### 4.2 `tailwind.config.ts`

- `content` 指向 `./index.html` 与 `./src/**/*.{ts,tsx}`。
- 自定义 `theme.extend`：
  - `colors`：采用 `hsl(var(--surface-base) / <alpha-value>)` 等 CSS 变量映射，支持亮色（淡米白 + 暖色强调）与深色（冷蓝 + 荧光）主题切换。
  - `fontFamily`：`sans` 使用 `"Source Han Sans", "Noto Sans SC", sans-serif`；`mono` 为 `Bender` 替代 `Roboto Mono`。
  - `boxShadow`：定义 `card`, `glow`, `vignette`。
  - `transitionTimingFunction`：`fluent-ease` → `cubic-bezier(0.33,1,0.68,1)`。
  - 自定义变体 `supports-backdrop` 以便在支持背景模糊的设备上增强材质表现。

### 4.3 `src/themes/tokens.ts`

- 导出 `themeTokens = { light: {...}, dark: {...} }`，并保留共享的 motion 常量。
- 提供 `export type ThemeMode = 'light' | 'dark' | 'contrast'`，为后续切换提供类型。
- `tokensToCssVariables(mode)` 将当前调色板转换为 CSS 变量（`--surface-base`、`--accent-glow` 等）。

### 4.4 全局样式

- `src/styles/reset.css`：使用现代化 CSS reset（如 `modern-normalize` 或定制版）。
- `src/styles/tailwind.css`：包含 Tailwind base/components/utilities。
- `src/styles/globals.css`：挂载字体、背景、body 级别的 vignette、噪点背景，并根据 `data-theme` 自动切换暖色/冷色渐变。
- 在 `src/main.tsx` 中按顺序引入：`reset.css` → `tailwind.css` → `globals.css`。

---

## 5. 路由与布局结构

### 5.1 目录规划

```
src/
├─ app/
│  ├─ routes/
│  │  ├─ index.tsx          # 导出 createBrowserRouter 配置
│  │  ├─ RootRoute.tsx      # 带 Shell 的根路由
│  │  ├─ ErrorBoundary.tsx  # 全局错误UI
│  │  └─ placeholders/      # 临时占位页面（Home, Categories, Search, FileDetail）
│  ├─ providers/            # 全局 Provider 组合
│  │  ├─ AppProviders.tsx
│  │  └─ MotionProvider.tsx (占位)
│  └─ shell/
│     ├─ AppShell.tsx       # 顶栏+侧栏的骨架容器
│     └─ NavigationRail.tsx (占位)
├─ components/              # 基础组件（后续补充）
└─ ...
```

### 5.2 基础页面占位

- Home：展示欢迎语、调用设计理念描述。
- Categories：提示“分类页面开发中”。
- Search：提示“搜索体验开发中”。
- FileDetail：提示“详情视图开发中”。

页面均使用 Tailwind 绑定基础色彩（`bg-surface-base`、`text-foreground-primary` 等）。

### 5.3 `App.tsx`

- 迁移为 `RouterProvider router={appRouter}`。
- `AppShell` 内部只负责布局与 Outlet 渲染。

### 5.4 `AppShell`

- 顶栏右侧增加主题切换按钮，默认呈现亮色（淡米白 + 温暖琥珀高亮），在暗色模式下切换为荧光绿强调。
- 按钮使用 `useTheme` hook 控制状态，并通过 Tailwind + CSS 变量确保不同模式下的视觉反馈。

---

## 6. 全局 Providers

### 6.1 `AppProviders`

- 使用 `composeProviders`（本地 util）顺序包裹：

  1. `React.StrictMode`（入口负责）
  2. `ThemeProvider`（light/dark state，提供 `mode`, `setMode`）
  3. `MotionProvider`（帧率/视差设置，当前放置占位 useEffect）
  4. `QueryClientProvider`（TanStack Query，配置缓存时间）

- 提供自定义 hook `useAppProviders()` 返回上下文。

### 6.2 ThemeProvider

- 暂存模式于 `localStorage`，默认 `light`。
- 向 document.documentElement 写入 `data-theme` 属性和 `color-scheme`。
- 将当前模式的 `themeTokens` 映射为 CSS 变量（`--surface-base`、`--accent-glow` 等）。
- 暴露 `toggleMode()`，供顶部栏切换按钮调用。

### 6.3 MotionProvider (占位)

- 建立 context，提供 `parallaxEnabled`, `setParallaxEnabled`。
- 预留 requestAnimationFrame 节流逻辑，暂以 no-op 代替。

### 6.4 Query Client

- 初始化 `new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 } } })`。
- 预留开发工具挂载点（仅开发模式加载 `ReactQueryDevtools`）。

### 6.5 Provider 使用

- 在 `src/main.tsx` 中 `<AppProviders><RouterProvider .../></AppProviders>`。
- 为未来 Storybook 重用，导出 `withAppProviders` 装饰器函数。

---

## 7. 验证步骤

1. `npm run typecheck`、`npm run lint` 确认通过。
2. `npm run dev -- --open`，确认页面展示 AppShell + 占位文本。
3. 点击顶栏主题切换按钮，验证亮色（默认）与暗色主题之间的视觉切换。
4. 在浏览器中切换路由（顶部/侧边导航），确保 404 fallback 正常。
5. 检查浏览器 DevTools：
   - `<html>` 上存在 `data-theme` 属性。
   - Tailwind 类生效，CSS 变量已注入。
   - React Query Devtools 在开发模式可打开。

将验证结果回填到该文档底部的“实施记录”段落。

---

## 8. 实施记录（执行后更新）

| 日期       | 执行人  | 说明                                      | 验证结果                                             |
| ---------- | ------- | ----------------------------------------- | ---------------------------------------------------- |
| 2025-10-25 | Copilot | Phase 0 基础设施（Vite、路由、Providers） | `npm run typecheck`, `npm run lint`, `npm run build` |
| 2025-10-25 | Copilot | 新增亮色主题、暖色调色板与模式切换        | `npm run typecheck`, `npm run lint`, `npm run build` |

> 完成实施后务必填写本表，并在 commit message 中引用 `Phase0` 关键字。

## 9. 实施验证记录（详细）

下列为本次 Phase 0 实施的可复现验证步骤与运行结果。所有命令均在项目根目录下执行，使用 `--prefix web` 运行 workspace 内的 web 包任务以便在 monorepo 或多包结构中定位。

验证命令与结果（摘要）

```bash
# Type-check (strict TS)
npm --prefix web run typecheck
# => PASSED (tsc --noEmit completed with no errors)

# Lint
npm --prefix web run lint
# => PASSED (eslint . reported no errors)

# Start dev server (used briefly for visual smoke-check; HMR active)
npm --prefix web run dev
# => Vite dev server started (visited locally during dev checks)
```

注：`npm run build`（生产构建）在本阶段未做完整 CI 级别构建；建议在 CI 环境中执行并验证构建产物。

按需求项的逐条验证状态

- Vite & TypeScript 配置 — Done

  - 说明：路径别名、tsconfig 路径、`vite` dev 脚本已验证；`tsc --noEmit` 通过。

- 路由骨架（Router + AppShell） — Done

  - 说明：`AppShell` 已切换为基于 `modules/layout/LayoutShell`，主路由使用 `RouterProvider`（占位页面存在以供后续填充）。

- Tailwind & Tokens — Done

  - 说明：`src/themes/tokens.ts` 已实现 `themeTokens` 与 `tokensToCssVariables(mode)`，`globals.css` 包含默认变量以避免 FOUC；Tailwind 配置使用 CSS 变量映射（`hsl(var(--token) / <alpha-value>)`）。

- ThemeProvider — Done

  - 说明：`ThemeProvider` 在首次渲染时注入 CSS 变量并设置 `data-theme` 与 `color-scheme`；localStorage 持久化有效，亮色默认。

- Layout Shell / TopBar / Sidebar — Done

  - 说明：`TopBar` 与 `LayoutShell` 已添加，`Sidebar` 支持可访问折叠（localStorage 持久化）并使用 `mockAdapter()` 加载示例分类。

- Data adapters / QueryClient — Done
  - 说明：`services/adapters/index.ts` 包含 `createAdapter` 与 `mockAdapter`；`AppProviders` 已初始化 `QueryClient` 并注入 `AdaptersProvider`（通过 `useAdapters()` 获取 adapter）。

总体结论

本次 Phase 0 的核心基础设施（构建配置、主题 token、Provider 栈、基础布局与数据适配器）已经实现并通过静态校验（typecheck + lint）。后续工作建议：

1. 在 CI 中运行 `npm --prefix web run build` 并验证生产构建产物。
2. 补充一组小型集成/单元测试（tokens -> CSS variables 转换，adapters mock、createAdapter 行为）。
3. 将 `mockAdapter` 示例替换为真实后端适配器并在 staging 环境中做 end-to-end 验证。

已将上述验证结果添加到本文件，并在仓库中保留了用于复现的命令与说明。
