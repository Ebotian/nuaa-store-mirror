import type { KeyboardEvent, MouseEvent } from "react";
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

	const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onOpen?.(id);
		}
	};

	const { motionProps } = useCardMotion();

	return (
		<article
			role="button"
			aria-labelledby={`file-${id}-title`}
			aria-describedby={excerpt ? `file-${id}-excerpt` : undefined}
			tabIndex={0}
			className="group relative flex h-full flex-col overflow-hidden border border-surface-divider/55 bg-surface-base/8 px-5 py-5 text-left shadow-card transition duration-[var(--motion-medium)] hover:border-accent-focus/50 hover:bg-accent-focus/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			{...motionProps}
		>
			<div
				className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-10"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute inset-0 card-noise"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-[6px] card-scan-bar"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute inset-x-[18%] top-5 h-[1px] bg-linear-scan opacity-60"
				aria-hidden
			/>
			<div className="relative z-10 flex h-full flex-col gap-6">
				<div className="flex items-start gap-4">
					<div className="relative h-20 w-28 flex-shrink-0 overflow-hidden border border-surface-divider/50 bg-surface-base/20">
						{thumbnail ? (
							<img
								src={thumbnail}
								alt=""
								className="h-full w-full object-cover"
								loading="lazy"
							/>
						) : (
							<div
								className="flex h-full w-full items-center justify-center bg-accent-glow/12 text-[0.65rem] uppercase tracking-[0.3em] text-foreground-muted"
								aria-hidden
							>
								DOC
							</div>
						)}
						<div
							className="pointer-events-none absolute inset-0 card-noise"
							aria-hidden
						/>
						<span
							className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-linear-scan"
							aria-hidden
						/>
					</div>
					<div className="flex min-w-0 flex-1 flex-col gap-2">
						<span className="text-[0.62rem] uppercase tracking-[0.4em] text-foreground-muted">
							文件档案
						</span>
						<h3
							id={`file-${id}-title`}
							className="text-base font-semibold text-foreground-primary"
						>
							{title}
						</h3>
						{excerpt ? (
							<p
								id={`file-${id}-excerpt`}
								className="line-clamp-3 text-sm leading-relaxed text-foreground-subtle"
							>
								{excerpt}
							</p>
						) : (
							<p className="text-sm text-foreground-muted">暂无简介</p>
						)}
					</div>
				</div>
				<div className="mt-auto flex items-center justify-between border-t border-surface-divider/45 pt-4 text-xs font-mono uppercase tracking-[0.28em] text-foreground-muted">
					<div className="flex flex-wrap items-center gap-4">
						<span className="flex items-center gap-2">
							<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
								<path
									d="M4 6h16v12H4z"
									stroke="currentColor"
									strokeWidth="1.3"
									fill="none"
								/>
							</svg>
							<span>容量：—</span>
						</span>
						<span className="flex items-center gap-2">
							<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
								<path
									d="M5 4h14l-1.5 14h-11z"
									stroke="currentColor"
									strokeWidth="1.3"
									fill="none"
								/>
							</svg>
							<span>更新：—</span>
						</span>
					</div>
					<div className="flex items-center gap-2 opacity-0 transition-opacity duration-[var(--motion-medium)] group-hover:opacity-100 group-focus-within:opacity-100">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
							}}
							className="border border-accent-glow/40 bg-accent-glow/15 px-2 py-1 text-[0.65rem] tracking-[0.25em] text-foreground-primary transition-colors hover:bg-accent-glow/25"
						>
							预览
						</button>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
							}}
							className="border border-accent-focus/40 bg-accent-focus/15 px-2 py-1 text-[0.65rem] tracking-[0.25em] text-foreground-primary transition-colors hover:bg-accent-focus/25"
						>
							下载
						</button>
					</div>
				</div>
			</div>
		</article>
	);
});
