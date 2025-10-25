import { useFiles } from "@/hooks/useFiles";

import { FileCard } from "./FileCard";
import { SkeletonCard } from "./SkeletonCard";

export default function FileList({ categoryId }: { categoryId?: string }) {
	const { data, isLoading, isFetching, isError, refetch, error } =
		useFiles(categoryId);
	const hasData = !!(data && data.length > 0);
	const showSkeleton = isLoading || (isFetching && !hasData);
	const isEmpty = !showSkeleton && !isError && !hasData;

	return (
		<section
			aria-live="polite"
			aria-busy={showSkeleton}
			className="flex flex-col gap-6"
		>
			{showSkeleton ? (
				<div
					role="status"
					aria-label="正在装填内容"
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				>
					<span className="sr-only">正在装填内容</span>
					{Array.from({ length: 6 }).map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : null}

			{!showSkeleton && isError ? (
				<div
					role="alert"
					className="relative overflow-hidden border border-status-danger/50 bg-status-danger/10 px-6 py-6 text-foreground-primary shadow-card"
				>
					<div
						className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-10"
						aria-hidden
					/>
					<div className="relative z-10 flex flex-col gap-4">
						<div className="text-sm uppercase tracking-[0.35em] text-status-danger">
							系统警告
						</div>
						<p className="text-base text-foreground-primary">
							{error instanceof Error ? error.message : "加载文件时出现错误"}
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => refetch()}
								className="border border-status-danger/60 bg-status-danger/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground-primary transition-colors hover:bg-status-danger/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
							>
								重试
							</button>
							<button
								type="button"
								onClick={() => {
									if (typeof window !== "undefined") {
										window.scrollTo({ top: 0, behavior: "smooth" });
									}
								}}
								className="border border-surface-divider/50 bg-surface-base/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground-muted transition-colors hover:border-accent-focus/40 hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
							>
								返回顶部
							</button>
						</div>
					</div>
				</div>
			) : null}

			{!showSkeleton && !isError && isEmpty ? (
				<div className="relative overflow-hidden border border-surface-divider/50 bg-surface-base/8 px-6 py-10 text-center shadow-card">
					<div
						className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-10"
						aria-hidden
					/>
					<div
						className="pointer-events-none absolute inset-0 card-noise"
						aria-hidden
					/>
					<div className="relative z-10 flex flex-col items-center gap-3">
						<span className="text-xs uppercase tracking-[0.4em] text-foreground-muted">
							空舱
						</span>
						<p className="text-base text-foreground-primary">
							没有找到符合条件的文件
						</p>
						<p className="text-sm text-foreground-subtle">
							尝试调整分类、关键字或稍后再试。
						</p>
					</div>
				</div>
			) : null}

			{!showSkeleton && !isError && hasData ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{data!.map((file) => (
						<FileCard
							key={file.id}
							id={file.id}
							title={file.title}
							excerpt={file.excerpt}
						/>
					))}
				</div>
			) : null}

			{isFetching && hasData && !showSkeleton ? (
				<div className="text-right text-[0.65rem] uppercase tracking-[0.35em] text-foreground-muted">
					刷新中…
				</div>
			) : null}
		</section>
	);
}
