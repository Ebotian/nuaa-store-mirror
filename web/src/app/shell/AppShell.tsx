import type { PropsWithChildren } from "react";
import { memo } from "react";
import { Outlet } from "react-router-dom";

import { NavigationRail } from "./NavigationRail";
import { ThemeToggle } from "./ThemeToggle";

export const AppShell = memo(function AppShell({
	children,
}: PropsWithChildren) {
	return (
		<div className="flex min-h-screen flex-col bg-surface-base text-foreground-primary">
			<header className="relative z-20 border-b border-surface-divider bg-surface-elevated/80 backdrop-blur-xl">
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
							<span className="text-xl font-bold tracking-tight">
								Knowledge Hub
							</span>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<ThemeToggle />
						<span className="hidden rounded-full border border-surface-divider px-3 py-1 text-xs uppercase tracking-wide text-foreground-subtle md:inline-flex">
							Phase 0
						</span>
					</div>
				</div>
			</header>
			<div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-6 py-8">
				<NavigationRail />
				<main className="relative flex-1 overflow-hidden rounded-3xl border border-surface-divider bg-surface-elevated/70 p-8 shadow-vignette backdrop-blur-2xl">
					<div
						className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(139,255,176,0.08),_transparent_55%)]"
						aria-hidden
					/>
					<div className="relative z-10 min-h-full">
						{children ?? <Outlet />}
					</div>
				</main>
			</div>
			<footer className="border-t border-surface-divider bg-surface-elevated/60 backdrop-blur-xl">
				<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-foreground-muted">
					<span>© {new Date().getFullYear()} nuaa.store mirror</span>
					<span>Building Fluent × Cyber aesthetic foundation</span>
				</div>
			</footer>
		</div>
	);
});
