import { useCallback, useEffect, useMemo, useState } from "react";
import { useMotion } from "@/app/providers/MotionProvider";

/**
 * Small hook that returns props (style + event handlers) to wire subtle card motion.
 * - On hover: slight translateY and box-shadow grow
 * - On mount: simple fade-in + slide-up via inline style (keeps it SSR-friendly)
 * - Respects prefers-reduced-motion via MotionProvider
 */
export function useCardMotion() {
	const { parallaxEnabled } = useMotion();
	const [pointerFine, setPointerFine] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
		const media = window.matchMedia("(pointer: fine)");
		const update = () => setPointerFine(media.matches);
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);

	const motionActive = parallaxEnabled && pointerFine;

	const baseStyle = useMemo(() => {
		if (!motionActive) {
			return {
				opacity: 1,
				transition: "opacity var(--motion-medium)",
			} as const;
		}

		return {
			transform: "translateZ(0)",
			transition:
				"transform var(--motion-medium), box-shadow var(--motion-medium), opacity var(--motion-medium)",
			opacity: 0,
			transformOrigin: "center top",
		} as const;
	}, [motionActive]);

	const handleMouseEnter = useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			if (!motionActive) return;
			const el = e.currentTarget as HTMLElement;
			el.style.willChange = "transform, box-shadow, opacity";
			el.style.transform = "translateY(-6px)";
			el.style.boxShadow = "var(--shadow-glow)";
			el.style.opacity = "1";
		},
		[motionActive]
	);

	const handleMouseLeave = useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			if (!motionActive) return;
			const el = e.currentTarget as HTMLElement;
			el.style.transform = "translateY(0)";
			el.style.boxShadow = "var(--shadow-card)";
			el.style.removeProperty("will-change");
		},
		[motionActive]
	);

	const handleMount = useCallback(
		(el: HTMLElement | null) => {
			if (!el) return;
			if (!motionActive) {
				el.style.opacity = "1";
				el.style.removeProperty("will-change");
				return;
			}
			// trigger a short mount animation
			requestAnimationFrame(() => {
				el.style.opacity = "1";
				el.style.transform = "translateY(0)";
			});
		},
		[motionActive]
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
