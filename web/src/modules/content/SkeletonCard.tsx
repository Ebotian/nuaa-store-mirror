import { memo } from "react";

export const SkeletonCard = memo(function SkeletonCard() {
	return (
		<article
			role="presentation"
			aria-hidden="true"
			className="relative flex h-full flex-col overflow-hidden border border-surface-divider/50 bg-surface-base/6 px-5 py-5 shadow-card"
		>
			<div className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-10" />
			<div className="pointer-events-none absolute inset-0 card-noise" />
			<div className="pointer-events-none absolute inset-x-0 top-0 h-[6px] skeleton-scan-bar" />
			<div className="relative z-10 flex h-full flex-col gap-6">
				<div className="flex items-start gap-4">
					<div className="relative h-20 w-28 flex-shrink-0 overflow-hidden border border-surface-divider/45 bg-surface-base/12">
						<div className="absolute inset-0 skeleton-sheen" />
					</div>
					<div className="flex min-w-0 flex-1 flex-col gap-3">
						<span className="h-3 w-16 skeleton-bar" />
						<span className="h-4 w-3/4 skeleton-bar" />
						<span className="h-4 w-2/3 skeleton-bar" />
					</div>
				</div>
				<div className="mt-auto flex flex-col gap-3 border-t border-surface-divider/45 pt-4">
					<span className="h-3 w-28 skeleton-bar" />
					<span className="h-3 w-36 skeleton-bar" />
				</div>
			</div>
		</article>
	);
});
