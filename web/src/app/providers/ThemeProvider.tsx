import type { PropsWithChildren } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import type { ThemeMode } from "@themes";
import { tokensToCssVariables } from "@themes";

const STORAGE_KEY = "nuaa-theme-mode";
const DEFAULT_MODE: ThemeMode = "light";

type ThemeContextValue = {
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
	toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

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

	useEffect(() => {
		applyTheme(mode);
		window.localStorage.setItem(STORAGE_KEY, mode);
	}, [mode]);

	const setMode = useCallback((next: ThemeMode) => {
		setModeState(next);
	}, []);

	const toggleMode = useCallback(() => {
		setModeState((prev: ThemeMode) => (prev === "dark" ? "light" : "dark"));
	}, []);

	const value = useMemo<ThemeContextValue>(
		() => ({ mode, setMode, toggleMode }),
		[mode, setMode, toggleMode]
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) {
		throw new Error("useTheme must be used within ThemeProvider");
	}
	return ctx;
}
