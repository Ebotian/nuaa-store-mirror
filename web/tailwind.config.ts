import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	darkMode: ["class", '[data-theme="dark"]'],
	theme: {
		extend: {
			colors: {
				surface: {
					base: "hsl(var(--surface-base) / <alpha-value>)",
					elevated: "hsl(var(--surface-elevated) / <alpha-value>)",
					divider: "hsl(var(--surface-divider) / <alpha-value>)",
				},
				foreground: {
					primary: "hsl(var(--foreground-primary) / <alpha-value>)",
					subtle: "hsl(var(--foreground-subtle) / <alpha-value>)",
					muted: "hsl(var(--foreground-muted) / <alpha-value>)",
					inverted: "hsl(var(--foreground-inverted) / <alpha-value>)",
				},
				accent: {
					glow: "hsl(var(--accent-glow) / <alpha-value>)",
					focus: "hsl(var(--accent-focus) / <alpha-value>)",
				},
				status: {
					danger: "hsl(var(--status-danger) / <alpha-value>)",
					warning: "hsl(var(--status-warning) / <alpha-value>)",
					success: "hsl(var(--status-success) / <alpha-value>)",
				},
			},
			fontFamily: {
				sans: [
					'"Source Han Sans SC"',
					'"Noto Sans SC"',
					"system-ui",
					"sans-serif",
				],
				mono: ['"Roboto Mono"', "Menlo", "monospace"],
			},
			boxShadow: {
				card: "var(--shadow-card)",
				glow: "var(--shadow-glow)",
				vignette: "var(--shadow-vignette)",
			},
			transitionTimingFunction: {
				"fluent-ease": "cubic-bezier(0.33, 1, 0.68, 1)",
			},
			backdropBlur: {
				xl: "20px",
				"2xl": "32px",
			},
			keyframes: {
				"particle-float": {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-6px)" },
				},
			},
			animation: {
				"particle-float": "particle-float 6s ease-in-out infinite",
			},
		},
	},
	plugins: [
		plugin(({ addVariant }) => {
			addVariant("supports-backdrop", "@supports (backdrop-filter: blur(1px))");
		}),
	],
};

export default config;
