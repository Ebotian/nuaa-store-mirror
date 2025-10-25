import { createContext, useContext } from "react";
import type { Adapter } from "@services/adapters";

export const AdaptersContext = createContext<Adapter | null>(null);

export function useAdapters() {
	const ctx = useContext(AdaptersContext);
	if (!ctx) throw new Error("useAdapters must be used within AdaptersProvider");
	return ctx;
}

export default AdaptersContext;
