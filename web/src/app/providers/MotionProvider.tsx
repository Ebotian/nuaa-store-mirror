import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type MotionPreferences = {
	parallaxEnabled: boolean;
	setParallaxEnabled: (value: boolean) => void;
};

const MotionContext = createContext<MotionPreferences | null>(null);

export function MotionProvider({ children }: PropsWithChildren) {
	const [parallaxEnabled, setParallaxEnabled] = useState(true);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (media.matches) {
			setParallaxEnabled(false);
		}

		const listener = (event: MediaQueryListEvent) => {
			setParallaxEnabled(!event.matches);
		};

		media.addEventListener("change", listener);
		return () => media.removeEventListener("change", listener);
	}, []);

	const value = useMemo<MotionPreferences>(
		() => ({ parallaxEnabled, setParallaxEnabled }),
		[parallaxEnabled]
	);

	return (
		<MotionContext.Provider value={value}>{children}</MotionContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMotion() {
	const ctx = useContext(MotionContext);
	if (!ctx) {
		throw new Error("useMotion must be used within MotionProvider");
	}
	return ctx;
}
