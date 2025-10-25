import { memo } from "react";

export const SkeletonCard = memo(function SkeletonCard() {
	return (
		<article className="animate-skeleton rounded-2xl border border-surface-divider bg-surface-elevated/60 p-4">
			<div className="flex items-start gap-4">
				<div
					className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-md bg-surface-base/40"
					aria-hidden
				/>
				<div className="flex-1">
					<div className="h-4 w-1/2 rounded bg-surface-base/30 mb-2" />
					<div className="h-3 w-3/4 rounded bg-surface-base/30 mb-1" />
					<div className="h-3 w-2/3 rounded bg-surface-base/30" />
				</div>
			</div>
		</article>
	);
});
