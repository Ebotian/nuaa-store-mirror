import { memo } from "react";

export const CategoriesPlaceholder = memo(function CategoriesPlaceholder() {
	return (
		<section className="flex h-full flex-col items-center justify-center gap-3 text-center">
			<h1 className="text-2xl font-medium tracking-tight">分类视图建设中</h1>
			<p className="max-w-lg text-sm text-foreground-subtle">
				分类树与筛选体验将在后续迭代中逐步上线，敬请期待。
			</p>
		</section>
	);
});
