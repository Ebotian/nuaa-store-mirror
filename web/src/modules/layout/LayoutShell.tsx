import type { PropsWithChildren } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

export function LayoutShell({ children }: PropsWithChildren) {
	return (
		<div className="flex min-h-screen flex-col bg-surface-base text-foreground-primary">
			<TopBar />
			<div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-6 py-8">
				<Sidebar />
				<main className="relative flex-1 overflow-hidden rounded-3xl border border-surface-divider bg-surface-elevated/70 p-8 shadow-vignette backdrop-blur-2xl">
					<div
						className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(139,255,176,0.08),_transparent_55%)]"
						aria-hidden
					/>
					<div className="relative z-10 min-h-full">{children}</div>
				</main>
			</div>
		</div>
	);
}

export default LayoutShell;
