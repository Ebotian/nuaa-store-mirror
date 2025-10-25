import { Fragment, type ReactNode, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import FileList from "@/modules/content/FileList";
import { useCategoryDetail } from "@/hooks/useCategoryDetail";

function MainFrame({ children }: { children: ReactNode }) {
	return (
		<main className="flex flex-1 min-h-0 flex-col overflow-hidden">
			<div className="flex-1 space-y-6 overflow-y-auto p-4">{children}</div>
		</main>
	);
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("zh-CN").format(value);
}

function formatBytes(bytes: number) {
	if (!bytes) return "0 B";
	const units = ["B", "KB", "MB", "GB", "TB"];
	const base = 1024;
	const index = Math.min(
		units.length - 1,
		Math.floor(Math.log(bytes) / Math.log(base))
	);
	const value = bytes / Math.pow(base, index);
	return `${
		value >= 100
			? value.toFixed(0)
			: value >= 10
			? value.toFixed(1)
			: value.toFixed(2)
	} ${units[index]}`;
}

function formatDateTime(iso: string | null) {
	if (!iso) return "暂无记录";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "暂无记录";
	return new Intl.DateTimeFormat("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(date);
}

export default function CategoryDetailRoute() {
	const { categoryId: encoded } = useParams<{ categoryId: string }>();
	const categoryId = encoded ? decodeURIComponent(encoded) : undefined;
	const navigate = useNavigate();

	const { data, isLoading, isError, error } = useCategoryDetail(categoryId);

	const parentId = data?.category.parentId ?? null;

	const breadcrumbNodes = useMemo(() => {
		if (!data) return [] as { id: string; name: string }[];
		return [
			{ id: "root", name: "全部分类" },
			...data.breadcrumbs.map((b) => ({ id: b.id, name: b.name })),
		];
	}, [data]);

	const breadcrumbElements = useMemo(() => {
		return breadcrumbNodes.map((node, index) => {
			const isLast = index === breadcrumbNodes.length - 1;
			if (node.id === "root") {
				return (
					<Fragment key={node.id}>
						<Link
							to="/categories"
							className="text-[0.65rem] uppercase tracking-[0.35em] text-foreground-muted transition hover:text-foreground-primary"
						>
							{node.name}
						</Link>
						{!isLast ? (
							<span className="text-foreground-muted/60">/</span>
						) : null}
					</Fragment>
				);
			}
			return (
				<Fragment key={node.id}>
					<Link
						to={`/categories/${encodeURIComponent(node.id)}`}
						className="text-[0.65rem] uppercase tracking-[0.35em] text-foreground-muted transition hover:text-foreground-primary"
					>
						{node.name}
					</Link>
					{!isLast ? <span className="text-foreground-muted/60">/</span> : null}
				</Fragment>
			);
		});
	}, [breadcrumbNodes]);

	if (!categoryId) {
		return (
			<MainFrame>
				<section className="relative overflow-hidden border border-status-danger/40 bg-status-danger/10 p-6 text-center shadow-card">
					<h1 className="text-xl font-semibold text-status-danger">
						缺少分类信息
					</h1>
					<p className="mt-2 text-sm text-foreground-primary">
						无法识别所请求的分类，请返回分类总览重新选择。
					</p>
					<div className="mt-4 flex justify-center">
						<Link
							to="/categories"
							className="border border-status-danger/50 bg-status-danger/15 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-primary transition hover:bg-status-danger/25"
						>
							返回分类
						</Link>
					</div>
				</section>
			</MainFrame>
		);
	}

	if (isLoading) {
		return (
			<MainFrame>
				<section className="relative overflow-hidden border border-surface-divider/50 bg-surface-base/10 p-6 shadow-card">
					<div
						className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-5"
						aria-hidden
					/>
					<div
						className="pointer-events-none absolute inset-0 card-noise"
						aria-hidden
					/>
					<div className="relative space-y-4 animate-pulse">
						<div className="h-4 w-1/3 bg-surface-divider/60" />
						<div className="h-8 w-2/5 bg-surface-divider/60" />
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{Array.from({ length: 4 }).map((_, idx) => (
								<div key={idx} className="h-24 bg-surface-divider/40" />
							))}
						</div>
					</div>
				</section>
				<section className="space-y-4">
					<div className="h-6 w-32 animate-pulse bg-surface-divider/60" />
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{Array.from({ length: 3 }).map((_, idx) => (
							<div
								key={idx}
								className="h-24 animate-pulse bg-surface-divider/40"
							/>
						))}
					</div>
				</section>
				<section className="space-y-4">
					<div className="h-6 w-32 animate-pulse bg-surface-divider/60" />
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 6 }).map((_, idx) => (
							<div
								key={idx}
								className="h-40 animate-pulse bg-surface-divider/40"
							/>
						))}
					</div>
				</section>
			</MainFrame>
		);
	}

	if (isError) {
		return (
			<MainFrame>
				<section className="relative overflow-hidden border border-status-danger/50 bg-status-danger/10 px-6 py-8 shadow-card">
					<div
						className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-8"
						aria-hidden
					/>
					<div className="relative z-10 space-y-4">
						<h1 className="text-xl font-semibold text-status-danger">
							加载分类失败
						</h1>
						<p className="text-sm text-foreground-primary">
							{error instanceof Error ? error.message : "服务器返回了意外结果"}
						</p>
						<div className="flex flex-wrap gap-3">
							<button
								onClick={() => navigate(0)}
								type="button"
								className="border border-status-danger/60 bg-status-danger/15 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-primary transition hover:bg-status-danger/25"
							>
								重试
							</button>
							<Link
								to="/categories"
								className="border border-surface-divider/60 bg-surface-base/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-muted transition hover:text-foreground-primary"
							>
								返回分类
							</Link>
						</div>
					</div>
				</section>
			</MainFrame>
		);
	}

	if (!data) return null;

	const { category, children, stats, filesSourceGeneratedAt } = data;
	const latestUpdated = formatDateTime(stats.latestUpdatedAt);
	const reportedFileLabel = `${formatNumber(
		stats.directFileCount
	)} / ${formatNumber(stats.reportedFileCount)}`;
	const generatedAtLabel = formatDateTime(filesSourceGeneratedAt);

	return (
		<MainFrame>
			<section className="relative overflow-hidden border border-surface-divider/60 bg-surface-elevated/70 px-6 py-8 shadow-card backdrop-blur-xl">
				<div
					className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-10"
					aria-hidden
				/>
				<div className="relative z-10 flex flex-col gap-6">
					<nav
						className="flex flex-wrap items-center gap-2"
						aria-label="面包屑导航"
					>
						{breadcrumbElements}
						{breadcrumbElements.length ? (
							<span className="text-[0.65rem] uppercase tracking-[0.35em] text-foreground-muted/60">
								/
							</span>
						) : null}
						<span className="text-[0.65rem] uppercase tracking-[0.35em] text-foreground-primary">
							{category.name}
						</span>
					</nav>
					<header className="space-y-2">
						<h1 className="text-2xl font-semibold text-foreground-primary">
							{category.name}
						</h1>
						<p className="text-sm text-foreground-muted">
							路径：
							<span className="font-mono text-foreground-primary/90">
								{category.path}
							</span>
						</p>
					</header>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div className="group relative overflow-hidden border border-surface-divider/60 bg-surface-base/10 px-4 py-5 transition hover:border-accent-focus/50 hover:bg-accent-focus/5">
							<div className="text-[0.6rem] uppercase tracking-[0.35em] text-foreground-muted">
								文件（已索引/预期）
							</div>
							<div className="mt-2 text-2xl font-semibold text-foreground-primary">
								{reportedFileLabel}
							</div>
						</div>
						<div className="group relative overflow-hidden border border-surface-divider/60 bg-surface-base/10 px-4 py-5 transition hover:border-accent-focus/50 hover:bg-accent-focus/5">
							<div className="text-[0.6rem] uppercase tracking-[0.35em] text-foreground-muted">
								子分类数量
							</div>
							<div className="mt-2 text-2xl font-semibold text-foreground-primary">
								{formatNumber(stats.childCount)}
								<span className="ml-1 text-sm text-foreground-muted">个</span>
							</div>
						</div>
						<div className="group relative overflow-hidden border border-surface-divider/60 bg-surface-base/10 px-4 py-5 transition hover:border-accent-focus/50 hover:bg-accent-focus/5">
							<div className="text-[0.6rem] uppercase tracking-[0.35em] text-foreground-muted">
								最新更新
							</div>
							<div className="mt-2 text-lg font-semibold text-foreground-primary">
								{latestUpdated}
							</div>
						</div>
						<div className="group relative overflow-hidden border border-surface-divider/60 bg-surface-base/10 px-4 py-5 transition hover:border-accent-focus/50 hover:bg-accent-focus/5">
							<div className="text-[0.6rem] uppercase tracking-[0.35em] text-foreground-muted">
								文件体量（直接）
							</div>
							<div className="mt-2 text-2xl font-semibold text-foreground-primary">
								{formatBytes(stats.totalSizeBytes)}
							</div>
						</div>
					</div>
					<div className="flex flex-wrap gap-3">
						{parentId ? (
							<button
								type="button"
								onClick={() =>
									navigate(`/categories/${encodeURIComponent(parentId)}`)
								}
								className="border border-surface-divider/60 bg-surface-base/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-muted transition hover:text-foreground-primary"
							>
								返回上一级
							</button>
						) : null}
						<Link
							to="/categories"
							className="border border-surface-divider/60 bg-surface-base/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-muted transition hover:text-foreground-primary"
						>
							返回总览
						</Link>
					</div>
					{filesSourceGeneratedAt ? (
						<p className="text-[0.65rem] uppercase tracking-[0.35em] text-foreground-muted">
							数据快照生成时间：{generatedAtLabel}
						</p>
					) : null}
				</div>
			</section>

			{children.length ? (
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold text-foreground-primary">
							子分类
						</h2>
						<span className="text-xs uppercase tracking-[0.35em] text-foreground-muted">
							{formatNumber(children.length)} 个
						</span>
					</div>
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{children.map((child) => (
							<Link
								key={child.id}
								to={`/categories/${encodeURIComponent(child.id)}`}
								className="relative overflow-hidden border border-surface-divider/60 bg-surface-base/10 px-4 py-4 transition hover:border-accent-focus/50 hover:bg-accent-focus/5"
							>
								<div className="text-sm font-semibold text-foreground-primary">
									{child.name}
								</div>
								<div className="mt-1 text-xs text-foreground-muted">
									{formatNumber(child.fileCount ?? 0)} 个文件 ·{" "}
									{formatNumber(child.childrenCount ?? 0)} 个子分类
								</div>
							</Link>
						))}
					</div>
				</section>
			) : null}

			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-foreground-primary">
						文件清单
					</h2>
					<span className="text-xs uppercase tracking-[0.35em] text-foreground-muted">
						直接文件 {formatNumber(stats.directFileCount)} 个
					</span>
				</div>
				<FileList categoryId={category.id} />
			</section>
		</MainFrame>
	);
}
