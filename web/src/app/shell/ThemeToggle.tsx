import { memo } from "react";

import { useTheme } from "@app/providers/useTheme";

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
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-5 w-5"
		aria-hidden
	>
		<circle
			cx="12"
			cy="12"
			r="5.4"
			fill="currentColor"
			stroke="currentColor"
			strokeWidth="0.8"
		/>
		<path
			d="M14.6 7.9a3.4 3.4 0 0 0-4.9 3.73"
			fill="none"
			stroke="currentColor"
			strokeWidth="0.8"
			strokeOpacity="0.35"
		/>
		<circle
			cx="14.5"
			cy="10.1"
			r="0.9"
			fill="currentColor"
			fillOpacity="0.35"
		/>
		<circle
			cx="10.2"
			cy="14.3"
			r="0.7"
			fill="currentColor"
			fillOpacity="0.25"
		/>
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
			className="group flex items-center gap-3 border border-surface-divider bg-surface-elevated/80 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-foreground-muted transition-colors duration-[var(--motion-medium)] hover:border-accent-glow/70 hover:bg-accent-glow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus rounded-[1.5rem]"
		>
			<span
				className={`relative flex h-7 w-7 items-center justify-center border transition-colors duration-[var(--motion-medium)] rounded-full ${
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
