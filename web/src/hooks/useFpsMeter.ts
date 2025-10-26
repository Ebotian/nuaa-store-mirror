import { useEffect, useRef, useState } from "react";

export function useFpsMeter(enabled: boolean) {
	const [fps, setFps] = useState(0);
	const frameCountRef = useRef(0);
	const lastTimeRef = useRef<number | null>(null);

	useEffect(() => {
		if (!enabled) {
			setFps(0);
			return undefined;
		}

		let rafId: number;
		const update = (time: number) => {
			frameCountRef.current += 1;
			if (lastTimeRef.current === null) {
				lastTimeRef.current = time;
			} else {
				const elapsed = time - lastTimeRef.current;
				if (elapsed >= 500) {
					const computedFps = Math.round(
						(frameCountRef.current * 1000) / (elapsed || 1)
					);
					setFps(computedFps);
					frameCountRef.current = 0;
					lastTimeRef.current = time;
				}
			}
			rafId = requestAnimationFrame(update);
		};

		rafId = requestAnimationFrame(update);

		return () => {
			cancelAnimationFrame(rafId);
			frameCountRef.current = 0;
			lastTimeRef.current = null;
		};
	}, [enabled]);

	return fps;
}
