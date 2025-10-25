import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { createAdapter, mockAdapter, type Adapter } from "@services/adapters";
import { AdaptersContext } from "./adaptersContext";

export function AdaptersProvider({ children }: PropsWithChildren) {
	const adapter = useMemo<Adapter>(() => {
		if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === "true") {
			return mockAdapter();
		}
		return createAdapter(import.meta.env.VITE_API_BASE_URL ?? "/api");
	}, []);

	return (
		<AdaptersContext.Provider value={adapter}>
			{children}
		</AdaptersContext.Provider>
	);
}

export default AdaptersProvider;
