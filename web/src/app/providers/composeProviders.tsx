import type { ComponentType, PropsWithChildren, ReactNode } from "react";

export type ProviderComponent = ComponentType<
	PropsWithChildren<Record<string, unknown>>
>;

function createIdentityProvider() {
	return function IdentityProvider({ children }: { children: ReactNode }) {
		return <>{children}</>;
	};
}

export function composeProviders(...providers: ProviderComponent[]) {
	if (providers.length === 0) {
		return createIdentityProvider();
	}

	return providers.reduceRight((Accumulated, Current) => {
		return function ComposedProvider({ children }: PropsWithChildren) {
			return (
				<Current>
					<Accumulated>{children}</Accumulated>
				</Current>
			);
		};
	}, createIdentityProvider());
}
