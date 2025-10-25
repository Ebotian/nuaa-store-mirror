import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import type { FileItem } from "@services/adapters";
import { useFiles } from "@/hooks/useFiles";
import { useSearch } from "@app/providers/SearchProvider";

import { FileCard } from "./FileCard";
import { SkeletonCard } from "./SkeletonCard";

export default function FileList({ categoryId }: { categoryId?: string }) {
	const queryClient = useQueryClient();
	const search = useSearch();
	const searchActive = search.isActive;

	const { data, isLoading, isFetching, isError, refetch, error } =
		useFiles(categoryId);

	const baseData = data ?? [];
	const baseHasData = baseData.length > 0;

	const searchMatches = useMemo(
		() => (searchActive ? search.getResultsForCategory(categoryId) : []),
		[categoryId, search, searchActive]
	);
	const searchData = searchActive
		? searchMatches.map((match) => match.file)
		: [];

	const displayData = searchActive ? searchData : baseData;
	const displayHasData = displayData.length > 0;

	const searchInFlight = search.indexLoading || search.isSearching;
	const baseSkeleton = isLoading || (isFetching && !baseHasData);
	const showSkeleton = searchActive
		? searchInFlight && !displayHasData
		: baseSkeleton;

	const isBusy = searchActive ? searchInFlight : isLoading || isFetching;

	const nonSearchError =
		!searchActive && isError
			? error instanceof Error
				? error
				: new Error("加载文件时出现错误")
			: null;
	const searchError = searchActive ? search.indexError : null;
	const displayError = searchError ?? nonSearchError;

	const isEmpty = !showSkeleton && !displayError && !displayHasData;
	const navigate = useNavigate();

	const handleReload = useCallback(() => {
		if (searchActive) {
			queryClient.invalidateQueries({ queryKey: ["files", "all"] });
		} else {
			refetch();
		}
	}, [queryClient, refetch, searchActive]);

	const emptyTitle = searchActive
		? "没有找到匹配的文件"
		: "没有找到符合条件的文件";
	const emptySubtitle = searchActive
		? "尝试调整关键字、切换分类或清除筛选。"
		: "尝试调整分类、关键字或稍后再试。";

	const triggerDownload = useCallback((file: FileItem) => {
		if (typeof window === "undefined") return;
		if (!file.downloadUrl) return;
		const anchor = document.createElement("a");
		anchor.href = file.downloadUrl;
		anchor.download = file.name ?? file.title ?? file.id;
		anchor.rel = "noopener";
		anchor.target = "_blank";
		anchor.style.display = "none";
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	}, []);

	const handleOpen = useCallback(
		(file: FileItem) => {
			if (file.supportsPreview && file.previewUrl) {
				const encodedId = encodeURIComponent(file.id);
				navigate(`/files/${encodedId}`);
				return;
			}
			triggerDownload(file);
		},
		[navigate, triggerDownload]
	);

	const handlePreview = useCallback(
		(file: FileItem) => {
			if (file.supportsPreview && file.previewUrl) {
				const encodedId = encodeURIComponent(file.id);
				navigate(`/files/${encodedId}`);
				return;
			}
			triggerDownload(file);
		},
		[navigate, triggerDownload]
	);

	const handleDownload = useCallback(
		(file: FileItem) => {
			triggerDownload(file);
		},
		[triggerDownload]
	);

	return (
		<section
			aria-live="polite"
			aria-busy={isBusy}
			className="flex flex-col gap-6"
		>
			{showSkeleton ? (
				<div aria-label="正在装填内容" className="flex flex-col gap-3">
					<span className="sr-only">正在装填内容</span>
					{Array.from({ length: 6 }).map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : null}

			{!showSkeleton && displayError ? (
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
							{displayError.message ?? "未能加载文件列表"}
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={handleReload}
								className="border border-status-danger/60 bg-status-danger/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground-primary transition-colors hover:bg-status-danger/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger"
							>
								重试
							</button>
							{searchActive ? (
								<button
									type="button"
									onClick={search.clearSearch}
									className="border border-surface-divider/50 bg-surface-base/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground-muted transition-colors hover:border-accent-focus/40 hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
								>
									清除筛选
								</button>
							) : (
								<button
									type="button"
									onClick={() => {
										if (typeof window !== "undefined") {
											window.scrollTo({ top: 0, behavior: "smooth" });
										}
									}}
									className="border border-surface-divider/50 bg-surface-base/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground-muted transition-colors hover:border-accent-focus/40 hover:text-foreground-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus rounded-[1.5rem]"
								>
									返回顶部
								</button>
							)}
						</div>
					</div>
				</div>
			) : null}

			{!showSkeleton && !displayError && isEmpty ? (
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
						<p className="text-base text-foreground-primary">{emptyTitle}</p>
						<p className="text-sm text-foreground-subtle">{emptySubtitle}</p>
					</div>
				</div>
			) : null}

			{!showSkeleton && !displayError && displayHasData ? (
				<div className="flex flex-col gap-3">
					{displayData.map((file) => (
						<FileCard
							key={file.id}
							file={file}
							onOpen={handleOpen}
							onPreview={handlePreview}
							onDownload={handleDownload}
						/>
					))}
				</div>
			) : null}

			{!searchActive && isFetching && baseHasData && !showSkeleton ? (
				<div className="text-right text-[0.65rem] uppercase tracking-[0.35em] text-foreground-muted">
					刷新中…
				</div>
			) : null}
		</section>
	);
}
