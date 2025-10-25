import { useCallback, useMemo } from "react";
import { useMotion } from "@/app/providers/MotionProvider";

/**
 * Small hook that returns props (style + event handlers) to wire subtle card motion.
 * - On hover: slight translateY and box-shadow grow
 * - On mount: simple fade-in + slide-up via inline style (keeps it SSR-friendly)
 * - Respects prefers-reduced-motion via MotionProvider
 */
export function useCardMotion() {
	const { parallaxEnabled } = useMotion();

	const baseStyle = useMemo(() => {
		if (!parallaxEnabled) {
			return { transition: "none" } as const;
		}

		return {
			transform: "translateZ(0)",
			transition:
				"transform var(--motion-medium), box-shadow var(--motion-medium), opacity var(--motion-medium)",
			willChange: "transform, box-shadow, opacity",
			opacity: 0,
			transformOrigin: "center top",
		} as const;
	}, [parallaxEnabled]);

	const handleMouseEnter = useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			if (!parallaxEnabled) return;
			const el = e.currentTarget as HTMLElement;
			el.style.transform = "translateY(-6px)";
			el.style.boxShadow = "var(--shadow-glow)";
			el.style.opacity = "1";
		},
		[parallaxEnabled]
	);

	const handleMouseLeave = useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			if (!parallaxEnabled) return;
			const el = e.currentTarget as HTMLElement;
			el.style.transform = "translateY(0)";
			el.style.boxShadow = "var(--shadow-card)";
		},
		[parallaxEnabled]
	);

	const handleMount = useCallback(
		(el: HTMLElement | null) => {
			if (!el) return;
			if (!parallaxEnabled) {
				el.style.opacity = "1";
				return;
			}
			// trigger a short mount animation
			requestAnimationFrame(() => {
				el.style.opacity = "1";
				el.style.transform = "translateY(0)";
			});
		},
		[parallaxEnabled]
	);

	return {
		motionProps: {
			style: baseStyle,
			onMouseEnter: handleMouseEnter,
			onMouseLeave: handleMouseLeave,
			// React.RefCallback is compatible with JSX ref for HTMLElement
			ref: handleMount as unknown as React.RefCallback<HTMLElement>,
		},
	};
}
