import { memo } from "react";

export const SkeletonCard = memo(function SkeletonCard() {
	return (
		<article
			role="presentation"
			aria-hidden="true"
			className="relative flex min-h-[5.5rem] flex-row items-stretch overflow-hidden border border-surface-divider/50 bg-surface-base/6 px-5 py-4 shadow-card"
		>
			<div className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-10" />
			<div className="pointer-events-none absolute inset-0 card-noise" />
			<div className="pointer-events-none absolute inset-x-0 top-0 h-[6px] skeleton-scan-bar" />
			<div className="relative z-10 flex w-full items-stretch gap-5">
				<div className="relative flex w-28 flex-shrink-0 flex-col justify-between border border-surface-divider/45 bg-surface-base/12 px-3 py-3">
					<span className="h-3 w-full skeleton-bar" />
					<span className="h-3 w-3/4 skeleton-bar" />
					<span className="h-3 w-5/6 skeleton-bar" />
					<div className="absolute inset-0 skeleton-sheen" />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
					<span className="h-4 w-3/4 skeleton-bar" />
					<div className="flex flex-wrap items-center gap-3">
						<span className="h-3 w-20 skeleton-bar" />
						<span className="h-3 w-24 skeleton-bar" />
						<span className="h-3 w-28 skeleton-bar" />
					</div>
					<div className="mt-auto flex justify-end gap-2">
						<span className="h-6 w-16 skeleton-bar" />
						<span className="h-6 w-16 skeleton-bar" />
					</div>
				</div>
			</div>
		</article>
	);
});
