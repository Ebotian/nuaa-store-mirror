import { useCallback, useEffect, useMemo, useState } from "react";

import { ThemeToggle } from "@app/shell/ThemeToggle";

function fireNavigationOpenEvent() {
	if (typeof document === "undefined") return;
	document.dispatchEvent(new CustomEvent("layout:navigation-open"));
}

export function TopBar() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return undefined;
		const handleScroll = () => {
			setScrolled(window.scrollY > 32);
		};
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navLabel = useMemo(
		() => (scrolled ? "指挥面板" : "导航指令"),
		[scrolled]
	);

	const handleNavOpen = useCallback(() => fireNavigationOpenEvent(), []);

	return (
		<header
			className={`group/topbar sticky top-0 z-40 overflow-hidden border-b border-surface-divider/60 transition-all duration-[var(--motion-medium)] ${
				scrolled
					? "bg-surface-elevated/85 py-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
					: "bg-surface-elevated/70 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-xl"
			}`}
		>
			<div className="pointer-events-none absolute inset-0" aria-hidden>
				<span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent-focus/60 to-transparent" />
				<span className="absolute inset-x-6 bottom-0 h-[1px] bg-linear-scan" />
				<span className="absolute inset-0 opacity-10 mix-blend-screen layout-grid-overlay" />
				<span className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-accent-glow/18 via-transparent to-transparent" />
			</div>
			<div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6">
				<div className="flex items-center gap-3">
					<div className="relative flex h-12 w-12 items-center justify-center border border-accent-focus/30 bg-accent-glow/15 text-[0.55rem] font-semibold uppercase tracking-[0.4em] text-foreground-muted">
						<span
							className="absolute inset-0 border border-surface-divider/40"
							aria-hidden
						/>
						<span className="relative font-mono text-[0.65rem] text-accent-focus">
							TAC-01
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xs font-semibold uppercase tracking-[0.42em] text-foreground-subtle">
							nuaa store mirror
						</span>
						<span className="text-xl font-bold tracking-tight text-foreground-primary">
							Knowledge Hub
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handleNavOpen}
						className="flex items-center gap-2 border border-accent-focus/30 bg-accent-focus/10 px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.35em] text-foreground-primary transition-colors duration-[var(--motion-medium)] hover:border-accent-focus/55 hover:bg-accent-focus/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus md:hidden"
						aria-controls="primary-navigation"
					>
						<span className="relative flex h-5 w-5 items-center justify-center border border-accent-focus/40 bg-transparent">
							<span className="h-[1px] w-3 bg-foreground-primary" aria-hidden />
							<span
								className="absolute h-[1px] w-3 -translate-y-1.5 bg-foreground-primary"
								aria-hidden
							/>
							<span
								className="absolute h-[1px] w-3 translate-y-1.5 bg-foreground-primary"
								aria-hidden
							/>
						</span>
						<span>{navLabel}</span>
					</button>
					<div role="search" aria-label="全局搜索" className="hidden md:block">
						<label className="flex items-center gap-2 border border-surface-divider bg-surface-base/20 px-3 py-2 text-sm text-foreground-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
							<svg
								className="h-4 w-4 text-accent-glow"
								viewBox="0 0 24 24"
								aria-hidden
							>
								<path
									d="M11 4a7 7 0 105.196 11.804l3.5 3.5-.707.707-3.5-3.5A7 7 0 1111 4z"
									fill="currentColor"
								/>
							</svg>
							<input
								type="search"
								className="w-64 bg-transparent text-sm text-foreground-primary placeholder:text-foreground-muted focus:outline-none"
								placeholder="搜索文件、课程、资源..."
								aria-label="搜索文件、课程、资源"
							/>
						</label>
					</div>
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
