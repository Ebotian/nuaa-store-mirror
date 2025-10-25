export type ThemeMode = "light" | "dark" | "contrast";

type Palette = {
	colors: {
		surface: { base: string; elevated: string; divider: string };
		foreground: {
			primary: string;
			subtle: string;
			muted: string;
			inverted: string;
		};
		accent: { glow: string; focus: string };
		status: { danger: string; warning: string; success: string };
	};
	shadows: { card: string; glow: string; vignette: string };
};

const motion = {
	fast: "120ms",
	medium: "240ms",
	slow: "360ms",
	easing: "cubic-bezier(0.33, 1, 0.68, 1)",
} as const;

const palettes: Record<Exclude<ThemeMode, "contrast">, Palette> = {
	light: {
		colors: {
			surface: {
				base: "36 42% 94%",
				elevated: "36 52% 99%",
				divider: "30 24% 75%",
			},
			foreground: {
				primary: "27 32% 20%",
				subtle: "27 26% 40%",
				muted: "28 24% 55%",
				inverted: "216 48% 92%",
			},
			accent: { glow: "32 96% 70%", focus: "22 80% 56%" },
			status: {
				danger: "0 70% 46%",
				warning: "35 100% 56%",
				success: "142 45% 45%",
			},
		},
		shadows: {
			card: "0 25px 65px -35px rgba(68, 54, 38, 0.25)",
			glow: "0 0 24px rgba(255, 184, 112, 0.45)",
			vignette: "inset 0 0 120px rgba(74, 54, 36, 0.18)",
		},
	},
	dark: {
		colors: {
			surface: {
				base: "216 48% 12%",
				elevated: "218 42% 16%",
				divider: "220 30% 32%",
			},
			foreground: {
				primary: "216 60% 95%",
				subtle: "220 32% 72%",
				muted: "222 28% 58%",
				inverted: "36 42% 94%",
			},
			accent: { glow: "141 100% 74%", focus: "39 100% 70%" },
			status: {
				danger: "350 100% 65%",
				warning: "35 100% 60%",
				success: "141 100% 74%",
			},
		},
		shadows: {
			card: "0 20px 45px -25px rgba(11, 22, 35, 0.7)",
			glow: "0 0 25px rgba(139, 255, 176, 0.45)",
			vignette: "inset 0 0 120px rgba(15, 23, 41, 0.75)",
		},
	},
} as const;

export const themeTokens = {
	palettes,
	motion,
} as const;

export type ThemeTokens = typeof themeTokens;

const MODE_FALLBACK: Record<ThemeMode, keyof typeof palettes> = {
	light: "light",
	dark: "dark",
	contrast: "light",
};

export function tokensToCssVariables(mode: ThemeMode): Record<string, string> {
	const resolvedMode = MODE_FALLBACK[mode];
	const palette = palettes[resolvedMode];

	return {
		"--surface-base": palette.colors.surface.base,
		"--surface-elevated": palette.colors.surface.elevated,
		"--surface-divider": palette.colors.surface.divider,
		"--foreground-primary": palette.colors.foreground.primary,
		"--foreground-subtle": palette.colors.foreground.subtle,
		"--foreground-muted": palette.colors.foreground.muted,
		"--foreground-inverted": palette.colors.foreground.inverted,
		"--accent-glow": palette.colors.accent.glow,
		"--accent-focus": palette.colors.accent.focus,
		"--status-danger": palette.colors.status.danger,
		"--status-warning": palette.colors.status.warning,
		"--status-success": palette.colors.status.success,
		"--shadow-card": palette.shadows.card,
		"--shadow-glow": palette.shadows.glow,
		"--shadow-vignette": palette.shadows.vignette,
		"--motion-fast": motion.fast,
		"--motion-medium": motion.medium,
		"--motion-slow": motion.slow,
		"--motion-easing-fluent": motion.easing,
	} as Record<string, string>;
}

export default themeTokens;
