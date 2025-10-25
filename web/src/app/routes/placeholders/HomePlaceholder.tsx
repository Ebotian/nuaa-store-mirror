import RecentFiles from "@/modules/content/RecentFiles";

export default function HomePlaceholder() {
	return (
		<main className="space-y-6 p-4">
			<section className="border border-surface-divider bg-surface-elevated/80 p-6">
				<h1 className="text-2xl font-bold text-foreground-primary">
					NUAA Store Mirror
				</h1>
				<p className="mt-2 text-sm text-foreground-subtle">
					这是南京航空航天大学的一个非官方镜像站点, 旨在为广大师生提供便捷的资源访问服务. 您可以在左方浏览和索引文件, 查看或者下载.
				</p>
			</section>

			<RecentFiles />
		</main>
	);
}
