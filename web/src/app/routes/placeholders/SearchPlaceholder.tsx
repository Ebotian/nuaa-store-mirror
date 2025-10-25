import { memo } from "react";

export const SearchPlaceholder = memo(function SearchPlaceholder() {
	return (
		<section className="flex h-full flex-col items-center justify-center gap-3 text-center">
			<h1 className="text-2xl font-medium tracking-tight">搜索体验筹备中</h1>
			<p className="max-w-lg text-sm text-foreground-subtle">
				全局搜索、快速筛选与结果排序将在 Phase 3 完成，我们正在搭建基础设施。
			</p>
		</section>
	);
});
