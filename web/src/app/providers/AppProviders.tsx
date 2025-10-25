import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { composeProviders } from "./composeProviders";
import { MotionProvider } from "./MotionProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AdaptersProvider } from "./AdaptersProvider";
import { SearchProvider } from "./SearchProvider";

const Providers = composeProviders(
	ThemeProvider,
	MotionProvider,
	AdaptersProvider,
	QueryProvider,
	SearchProvider
);

export function AppProviders({ children }: PropsWithChildren) {
	return <Providers>{children}</Providers>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function withAppProviders(node: ReactNode) {
	return <AppProviders>{node}</AppProviders>;
}

function QueryProvider({ children }: PropsWithChildren) {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000,
						gcTime: 30 * 60 * 1000,
						refetchOnWindowFocus: false,
						retry: 1,
					},
				},
			})
	);

	return (
		<QueryClientProvider client={client}>
			{children}
			{import.meta.env.DEV ? (
				<ReactQueryDevtools initialIsOpen={false} />
			) : null}
		</QueryClientProvider>
	);
}
