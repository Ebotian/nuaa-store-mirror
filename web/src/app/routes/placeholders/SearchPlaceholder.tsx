import { memo } from "react";

import FileList from "@/modules/content/FileList";
import { useSearch } from "@app/providers/SearchProvider";

export const SearchPlaceholder = memo(function SearchPlaceholder() {
	const search = useSearch();
	const hasQuery = search.isActive;
	const isLoading = search.indexLoading || search.isSearching;
	const totalMatches = search.baseResults.length;
	const resultCount = search.results.length;
	const categoryFilter = search.activeCategoryFilter;

	if (!hasQuery) {
		return (
			<section className="flex h-full flex-col items-center justify-center gap-4 text-center">
				<h1 className="text-2xl font-medium text-foreground-primary">
					全局检索
				</h1>
				<p className="max-w-lg text-sm text-foreground-subtle">
					在顶部输入关键字，即可按标题、后缀名和文本内容搜索仓库文件。支持多关键词，使用空格分隔。
				</p>
			</section>
		);
	}

	return (
		<main className="flex flex-1 flex-col gap-6 p-4">
			<section className="relative overflow-hidden border border-surface-divider/60 bg-surface-elevated/70 px-6 py-5 shadow-card backdrop-blur">
				<div
					className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-10"
					aria-hidden
				/>
				<div className="relative flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-2">
						<span className="text-[0.65rem] uppercase tracking-[0.35em] text-foreground-muted">
							搜索关键字
						</span>
						<h1 className="text-2xl font-semibold text-foreground-primary">
							“{search.query}”
						</h1>
						<div className="flex flex-wrap items-center gap-3 text-xs text-foreground-subtle">
							<span className="uppercase tracking-[0.35em] text-foreground-muted">
								匹配 {resultCount}
								{categoryFilter ? ` / ${totalMatches}` : null} 个文件
							</span>
							{isLoading ? (
								<span className="text-foreground-primary/80">正在检索…</span>
							) : null}
							{categoryFilter ? (
								<span className="rounded border border-accent-focus/40 bg-accent-focus/10 px-2 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-foreground-primary">
									分类筛选：{categoryFilter}
								</span>
							) : null}
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={search.clearSearch}
							className="border border-surface-divider/60 bg-surface-base/15 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-muted transition hover:border-accent-focus/50 hover:text-foreground-primary"
						>
							清除筛选
						</button>
					</div>
				</div>
			</section>

			<FileList />
		</main>
	);
});
