import RecentFiles from "@/modules/content/RecentFiles";

export default function HomePlaceholder() {
	return (
		<main className="space-y-6 p-4">
			<section className="rounded-2xl border border-surface-divider bg-surface-elevated/80 p-6">
				<h1 className="text-2xl font-bold text-foreground-primary">
					NUAA Store Mirror
				</h1>
				<p className="mt-2 text-sm text-foreground-subtle">
					欢迎来到新版界面。下方显示仓库中最近索引的文件，您可以浏览、预览或下载原始文件。
				</p>
			</section>

			<RecentFiles />
		</main>
	);
}
