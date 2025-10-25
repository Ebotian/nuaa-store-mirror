import { memo } from "react";

import { useTheme } from "@app/providers/ThemeProvider";

const sunIcon = (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.6"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-5 w-5"
		aria-hidden
	>
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2m0 16v2m10-10h-2M6 12H4m15.07-7.07-1.42 1.42M8.35 17.65l-1.42 1.42m12.02 0-1.42-1.42M8.35 6.35 6.93 4.93" />
	</svg>
);

const moonIcon = (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.6"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-5 w-5"
		aria-hidden
	>
		<path d="M21 12.79A9 9 0 0 1 11.21 3 6.5 6.5 0 1 0 21 12.79z" />
	</svg>
);

export const ThemeToggle = memo(function ThemeToggle() {
	const { mode, toggleMode } = useTheme();
	const isDark = mode === "dark";

	return (
		<button
			type="button"
			onClick={toggleMode}
			aria-label={isDark ? "切换到亮色主题" : "切换到夜色主题"}
			aria-pressed={isDark}
			className="group flex items-center gap-3 border border-surface-divider bg-surface-elevated/80 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-foreground-muted transition-colors duration-[var(--motion-medium)] hover:border-accent-glow/70 hover:bg-accent-glow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
		>
			<span
				className={`relative flex h-7 w-7 items-center justify-center border transition-colors duration-[var(--motion-medium)] ${
					isDark
						? "bg-foreground-muted/20 text-foreground-inverted shadow-[0_0_35px_rgba(15,23,41,0.35)]"
						: "bg-gradient-to-br from-accent-glow/70 via-white/80 to-accent-focus/50 text-foreground-primary shadow-[0_0_45px_rgba(255,201,135,0.45)]"
				}`}
				aria-hidden="true"
			>
				<span
					className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[var(--motion-medium)] ${
						isDark ? "opacity-0" : "opacity-100"
					}`}
				>
					{sunIcon}
				</span>
				<span
					className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[var(--motion-medium)] ${
						isDark ? "opacity-100" : "opacity-0"
					}`}
				>
					{moonIcon}
				</span>
			</span>
			<span className="hidden text-[0.6rem] tracking-[0.4em] text-foreground-muted transition-colors duration-[var(--motion-medium)] sm:inline">
				{isDark ? "夜航" : "晨曦"}
			</span>
		</button>
	);
});
