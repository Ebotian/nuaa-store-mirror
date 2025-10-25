import type { PropsWithChildren } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

export function LayoutShell({ children }: PropsWithChildren) {
	return (
		<div className="relative flex h-screen flex-col overflow-hidden bg-surface-base text-foreground-primary transition-colors duration-[var(--motion-medium)]">
			<div
				className="pointer-events-none absolute inset-0 opacity-70 mix-blend-soft-light layout-grid-overlay"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute inset-0 mix-blend-screen"
				aria-hidden
			>
				<div className="absolute inset-0 layout-noise-overlay" />
				<div className="absolute inset-0 layout-horizon-glow" />
			</div>
			<TopBar />
			<div className="relative mx-auto flex w-full max-w-6xl flex-1 gap-6 px-6 py-8 min-h-0">
				<Sidebar />
				<main className="relative flex flex-1 flex-col overflow-hidden border border-surface-divider/70 bg-surface-elevated/75 shadow-vignette backdrop-blur-2xl">
					<div
						className="pointer-events-none absolute inset-0 border border-accent-glow/12 mix-blend-screen"
						aria-hidden
					/>
					<div
						className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-20"
						aria-hidden
					/>
					<div className="relative z-10 flex h-full min-h-0 flex-col">
						<div className="app-scroll flex-1 overflow-y-auto px-8 py-10 pr-9">
							<div className="min-h-full">{children}</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}

export default LayoutShell;
