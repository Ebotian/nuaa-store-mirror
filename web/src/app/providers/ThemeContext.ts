import { createContext } from "react";

import type { ThemeMode } from "@themes";

export type ThemeContextValue = {
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
	toggleMode: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
