import type { MouseEvent } from "react";
import { memo } from "react";
import { useCardMotion } from "./useCardMotion";

export type FileCardProps = {
	id: string;
	title: string;
	excerpt?: string;
	thumbnail?: string;
	onOpen?: (id: string) => void;
};

export const FileCard = memo(function FileCard({
	id,
	title,
	excerpt,
	thumbnail,
	onOpen,
}: FileCardProps) {
	const handleClick = (e: MouseEvent) => {
		e.preventDefault();
		onOpen?.(id);
	};

	const { motionProps } = useCardMotion();

	return (
		<article
			role="article"
			aria-labelledby={`file-${id}-title`}
			className="group rounded-2xl border border-surface-divider bg-surface-elevated/80 p-4 shadow-card"
			onClick={handleClick}
			{...motionProps}
		>
			<div className="flex items-start gap-4">
				<div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-md bg-surface-base/60">
					{thumbnail ? (
						<img
							src={thumbnail}
							alt=""
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					) : (
						<div className="h-full w-full bg-accent-glow/20" aria-hidden />
					)}
				</div>
				<div className="flex-1">
					<h3
						id={`file-${id}-title`}
						className="text-sm font-semibold text-foreground-primary"
					>
						{title}
					</h3>
					{excerpt ? (
						<p className="mt-1 text-xs text-foreground-subtle line-clamp-3">
							{excerpt}
						</p>
					) : null}
				</div>
			</div>
		</article>
	);
});
