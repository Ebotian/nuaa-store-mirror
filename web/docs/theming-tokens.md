# Theming Tokens 设计文档

目标：定义设计 Token（颜色、阴影、动效时序、字体等），并规定如何通过 `tokensToCssVariables(mode)` 注入到 `:root`。

优先级：非常高（全局依赖）

实现顺序：

1. Token 名称与语义（surface, foreground, accent, status, shadow, motion）
2. Light / Dark / Contrast 三套调色板（以 HSL 为主）
3. `src/themes/tokens.ts`：导出 `themeTokens` 类型与 `tokensToCssVariables(mode)` 函数
4. Tailwind 配置映射（使用 `hsl(var(--token) / <alpha-value>)`）
5. CSS 变量的预置以避免 FOUC（在 `globals.css` 中添加默认值）

规则与约定：

- Token 命名使用语义化前缀，如 `surface-base`, `surface-elevated`, `foreground-primary`, `accent-glow`。
- 颜色以 HSL 存储以便在运行时调整饱和度/亮度。
- 所有 shadow 使用 CSS 变量 `--shadow-*` 以便在不同主题中展开或压缩。
- 动效时序统一变量 `--motion-fast/medium/slow`。

开发 API：

- `export type ThemeMode = 'light' | 'dark' | 'contrast'`;
- `export const themeTokens: Record<ThemeMode, ThemePalette>`;
- `export function tokensToCssVariables(mode: ThemeMode): Record<string,string>`

验收条件：

- `tokensToCssVariables('light')` 返回一套 `--*` 变量映射，且 `ThemeProvider` 能设置到 `document.documentElement.style`。
- Tailwind 的 `tailwind.config.ts` 能引用这些 CSS 变量，并且在样式编译时不会报类型错误。
- `globals.css` 中存在一小段预置变量以避免闪烁。
