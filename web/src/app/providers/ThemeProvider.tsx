import type { PropsWithChildren } from "react";
import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
} from "react";

import type { ThemeMode } from "@themes";
import { tokensToCssVariables } from "@themes";

const STORAGE_KEY = "nuaa-theme-mode";
const DEFAULT_MODE: ThemeMode = "light";

export type ThemeContextValue = {
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
	toggleMode: () => void;
};
export const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveInitialMode(): ThemeMode {
	if (typeof window === "undefined") {
		return DEFAULT_MODE;
	}

	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark" || stored === "contrast") {
		return stored;
	}

	const prefersDark = window.matchMedia?.(
		"(prefers-color-scheme: dark)"
	).matches;
	return prefersDark ? "dark" : DEFAULT_MODE;
}

function applyTheme(mode: ThemeMode) {
	if (typeof document === "undefined") {
		return;
	}

	const root = document.documentElement;
	root.dataset.theme = mode;

	const cssVariables = tokensToCssVariables(mode);
	for (const [key, value] of Object.entries(cssVariables) as Array<
		[string, string]
	>) {
		root.style.setProperty(key, value);
	}

	const colorScheme = mode === "dark" ? "dark" : "light";
	root.style.colorScheme = colorScheme;
}

export function ThemeProvider({ children }: PropsWithChildren) {
	const [mode, setModeState] = useState<ThemeMode>(() => {
		const initialMode = resolveInitialMode();
		applyTheme(initialMode);
		return initialMode;
	});
	const [transitionState, setTransitionState] = useState<{
		key: number;
		nextMode: ThemeMode;
	} | null>(null);
	const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		applyTheme(mode);
		window.localStorage.setItem(STORAGE_KEY, mode);
	}, [mode]);

	const clearTransitionTimer = useCallback(() => {
		if (transitionTimerRef.current !== null) {
			clearTimeout(transitionTimerRef.current);
			transitionTimerRef.current = null;
		}
	}, []);

	const setMode = useCallback((next: ThemeMode) => {
		setModeState((prev) => {
			if (prev === next) {
				return prev;
			}
			setTransitionState({ key: Date.now(), nextMode: next });
			return next;
		});
	}, []);

	const toggleMode = useCallback(() => {
		setModeState((prev: ThemeMode) => {
			const next = prev === "dark" ? "light" : "dark";
			setTransitionState({ key: Date.now(), nextMode: next });
			return next;
		});
	}, []);

	useEffect(() => {
		if (!transitionState) return undefined;
		clearTransitionTimer();
		transitionTimerRef.current = setTimeout(() => {
			setTransitionState(null);
			transitionTimerRef.current = null;
		}, 1500);
		return () => clearTransitionTimer();
	}, [transitionState, clearTransitionTimer]);

	const value = useMemo<ThemeContextValue>(
		() => ({ mode, setMode, toggleMode }),
		[mode, setMode, toggleMode]
	);

	return (
		<ThemeContext.Provider value={value}>
			{children}
			{transitionState ? (
				<div
					key={transitionState.key}
					className={`theme-transition-overlay ${
						transitionState.nextMode === "dark"
							? "theme-transition-overlay--dark"
							: "theme-transition-overlay--light"
					}`}
				/>
			) : null}
		</ThemeContext.Provider>
	);
}
