import { ThemeToggle } from "@app/shell/ThemeToggle";

export function TopBar() {
	return (
		<header className="z-20 border-b border-surface-divider bg-surface-elevated/80 backdrop-blur-xl">
			<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
				<div className="flex items-center gap-3">
					<span
						className="h-10 w-10 rounded-lg bg-accent-glow/20 ring-1 ring-inset ring-accent-glow/40"
						aria-hidden
					/>
					<div className="flex flex-col">
						<span className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground-subtle">
							nuaa store mirror
						</span>
						<span className="text-xl font-bold tracking-tight text-foreground-primary">
							Knowledge Hub
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div role="search" aria-label="全局搜索" className="hidden md:block">
						<input
							className="rounded-md border border-surface-divider bg-transparent px-3 py-2 text-sm text-foreground-subtle"
							placeholder="搜索文件、课程、资源..."
						/>
					</div>
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
