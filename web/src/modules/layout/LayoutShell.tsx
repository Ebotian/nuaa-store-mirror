import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

type LayerState = "entering" | "entered" | "exiting";

type Layer = {
	key: string;
	node: ReactNode;
	state: LayerState;
};

export function LayoutShell({ children }: PropsWithChildren) {
	const location = useLocation();
	const FADE_DURATION_MS = 1000;
	const [layers, setLayers] = useState<Layer[]>(() => [
		{ key: location.key, node: children, state: "entered" },
	]);
	const enteringRefs = useRef<Map<string, number>>(new Map());
	const exitingRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map()
	);

	useEffect(() => {
		return () => {
			enteringRefs.current.forEach((rafId) => cancelAnimationFrame(rafId));
			exitingRefs.current.forEach((timerId) => clearTimeout(timerId));
		};
	}, []);

	useEffect(() => {
		setLayers((prev) => {
			const existing = prev.find((layer) => layer.key === location.key);
			if (existing) {
				return prev.map((layer) =>
					layer.key === location.key ? { ...layer, node: children } : layer
				);
			}
			const updated = prev.map((layer, idx) =>
				idx === prev.length - 1
					? {
							...layer,
							state: layer.state === "exiting" ? layer.state : "exiting",
					  }
					: layer
			);
			return [
				...updated,
				{ key: location.key, node: children, state: "entering" },
			];
		});
	}, [location.key, children]);

	useEffect(() => {
		const latestLayers = layers;
		const activeKey = latestLayers[latestLayers.length - 1]?.key;
		latestLayers.forEach((layer) => {
			if (layer.state === "entering" && !enteringRefs.current.has(layer.key)) {
				const rafId = requestAnimationFrame(() => {
					setLayers((prev) =>
						prev.map((prevLayer) =>
							prevLayer.key === layer.key
								? { ...prevLayer, state: "entered" }
								: prevLayer
						)
					);
					enteringRefs.current.delete(layer.key);
				});
				enteringRefs.current.set(layer.key, rafId);
			}

			if (
				layer.state === "exiting" &&
				!exitingRefs.current.has(layer.key) &&
				layer.key !== activeKey
			) {
				const timerId = setTimeout(() => {
					setLayers((prev) =>
						prev.filter((prevLayer) => prevLayer.key !== layer.key)
					);
					exitingRefs.current.delete(layer.key);
				}, FADE_DURATION_MS);
				exitingRefs.current.set(layer.key, timerId);
			}
		});
	}, [layers, FADE_DURATION_MS]);

	const activeKey = useMemo(
		() => layers[layers.length - 1]?.key ?? location.key,
		[layers, location.key]
	);

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
							<div className="content-stack">
								{layers.map((layer) => {
									const isActive = layer.key === activeKey;
									const positionClass =
										isActive && layer.state === "entered"
											? "content-layer--relative"
											: "content-layer--absolute";
									const stateClass =
										layer.state === "entering"
											? "content-layer--entering"
											: layer.state === "entered"
											? "content-layer--entered"
											: "content-layer--exiting";
									return (
										<div
											key={layer.key}
											className={`content-layer ${positionClass} ${stateClass}`.trim()}
											data-page-key={layer.key}
										>
											<div className="min-h-full">{layer.node}</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}

export default LayoutShell;
