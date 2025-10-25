import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

import { mockAdapter } from "@services/adapters";

type CatNode = {
	id: string;
	name: string;
	path: string;
	parentId: string | null;
	fileCount: number;
	children?: CatNode[];
};

const MAX_BADGE_WEIGHT = 8;

function measureBadgeWeight(text: string) {
	return Array.from(text).reduce((total, char) => {
		const code = char.codePointAt(0) ?? 0;
		const isAscii = code >= 0x21 && code <= 0x7e;
		return total + (isAscii ? 0.5 : 1);
	}, 0);
}

function createBadgeLabel(name: string, fallback: string) {
	const cleanPrimary = name.replace(/\s+/g, "");
	const cleanFallback = fallback.replace(/\s+/g, "");
	const source = cleanPrimary || cleanFallback;
	if (!source) return "CAT";

	let weight = 0;
	let label = "";
	for (const char of Array.from(source)) {
		const increment = measureBadgeWeight(char);
		if (weight + increment > MAX_BADGE_WEIGHT) break;
		label += char;
		weight += increment;
	}

	if (!label) {
		label = source.slice(0, 1);
	}
	const hasNonAscii = Array.from(label).some(
		(char) => (char.codePointAt(0) ?? 0) > 0xff
	);
	return hasNonAscii ? label : label.toUpperCase();
}

function NavBadge({
	label,
	className = "h-12 w-full",
}: {
	label: string;
	className?: string;
}) {
	return (
		<span
			className={`relative inline-flex items-center justify-center ${className}`}
		>
			<span
				className="pointer-events-none absolute inset-0 rounded-lg border border-surface-divider/60 bg-surface-base/30"
				aria-hidden
			/>
			<span
				className="nav-badge-dots pointer-events-none absolute inset-[4px] rounded-[10px]"
				aria-hidden
			/>
			<span
				className="pointer-events-none absolute inset-0 rounded-lg border border-accent-focus/35 opacity-70"
				aria-hidden
			/>
			<span className="relative z-10 w-full px-4 text-[0.85rem] font-semibold uppercase tracking-[0.08em] text-foreground-primary truncate">
				{label}
			</span>
		</span>
	);
}

export function Sidebar() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [categories, setCategories] = useState<CatNode[]>([]);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		let mounted = true;

		(async function load() {
			try {
				const res = await fetch("/mock-data/categories.json");
				if (res.ok) {
					const body = await res.text();
					if (body.trim().length > 0) {
						try {
							const raw = JSON.parse(body) as Array<{
								id: string;
								name?: string;
								path?: string;
								parentId?: string | null;
								fileCount?: number;
							}>;
							if (Array.isArray(raw)) {
								const map = new Map<string, CatNode>();
								raw.forEach((c) =>
									map.set(c.id, {
										id: c.id,
										name: c.name ?? c.id,
										path: c.path ?? c.id,
										parentId: c.parentId ?? null,
										fileCount: c.fileCount ?? 0,
										children: [],
									})
								);
								const roots: CatNode[] = [];
								for (const node of map.values()) {
									if (node.parentId && map.has(node.parentId)) {
										map.get(node.parentId)!.children!.push(node);
									} else {
										roots.push(node);
									}
								}
								if (mounted) {
									setCategories(roots);
								}
								return;
							}
						} catch (error) {
							console.warn("Failed to parse categories.json", error);
						}
					}
				}
			} catch (error) {
				console.warn("Failed to load /mock-data/categories.json", error);
			}

			try {
				const list = await mockAdapter().fetchCategories();
				if (!mounted) return;
				const roots = list.map((c) => ({
					id: c.id,
					name: c.name,
					path: c.id,
					parentId: null,
					fileCount: 0,
					children: [],
				}));
				setCategories(roots);
			} catch (error) {
				console.warn("mockAdapter().fetchCategories() failed", error);
				if (mounted) {
					setCategories([]);
				}
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		if (typeof document === "undefined") return;
		const handleOpen = () => setDrawerOpen(true);
		document.addEventListener("layout:navigation-open", handleOpen);
		return () =>
			document.removeEventListener("layout:navigation-open", handleOpen);
	}, []);

	useEffect(() => {
		if (!drawerOpen || typeof document === "undefined") return;
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prevOverflow;
		};
	}, [drawerOpen]);

	useEffect(() => {
		if (!drawerOpen || typeof document === "undefined") return;
		const handler = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setDrawerOpen(false);
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [drawerOpen]);

	const activeCategory = useMemo(() => {
		const match = location.pathname.match(/^\/categories\/(.+)$/);
		if (match) return decodeURIComponent(match[1]);
		return null;
	}, [location.pathname]);

	const parentMap = useMemo(() => {
		const map = new Map<string, string | null>();
		const walk = (nodes: CatNode[], parent: string | null) => {
			nodes.forEach((node) => {
				map.set(node.id, parent);
				if (node.children?.length) {
					walk(node.children, node.id);
				}
			});
		};
		walk(categories, null);
		return map;
	}, [categories]);

	const activeTrail = useMemo(() => {
		const set = new Set<string>();
		if (!activeCategory) return set;
		let current: string | null | undefined = activeCategory;
		while (current) {
			set.add(current);
			current = parentMap.get(current) ?? null;
		}
		return set;
	}, [activeCategory, parentMap]);

	useEffect(() => {
		if (!activeTrail.size) return;
		setExpanded((prev) => {
			let mutated = false;
			const next = { ...prev };
			activeTrail.forEach((id) => {
				if (next[id]) return;
				// only expand if node actually has children
				const nodeHasChildren = categories.some((root) => {
					const stack: CatNode[] = [root];
					while (stack.length) {
						const node = stack.pop()!;
						if (node.id === id)
							return node.children && node.children.length > 0;
						if (node.children?.length) stack.push(...node.children);
					}
					return false;
				});
				if (nodeHasChildren) {
					next[id] = true;
					mutated = true;
				}
			});
			return mutated ? next : prev;
		});
	}, [activeTrail, categories]);

	const toggleNode = useCallback((id: string) => {
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
	}, []);

	const goToCategory = useCallback(
		(id: string) => {
			navigate(`/categories/${encodeURIComponent(id)}`);
			setDrawerOpen(false);
		},
		[navigate]
	);

	const goHome = useCallback(() => {
		navigate("/");
		setDrawerOpen(false);
	}, [navigate]);

	const closeDrawer = useCallback(() => setDrawerOpen(false), []);

	function CategoryItem({
		node,
		depth = 0,
	}: {
		node: CatNode;
		depth?: number;
	}) {
		const hasChildren = !!(node.children && node.children.length > 0);
		const isExpanded = !!expanded[node.id];
		const isActive = activeCategory === node.id;
		const inTrail = activeTrail.has(node.id);
		const indentStyle: CSSProperties | undefined =
			depth > 0 ? { marginLeft: depth * 12 } : undefined;
		const warningBarClass = isActive
			? "opacity-100 scale-y-100"
			: inTrail
			? "opacity-60 scale-y-100"
			: "opacity-0 scale-y-0";
		const badgeLabel = createBadgeLabel(node.name, node.id);

		return (
			<div key={node.id} className="flex flex-col">
				<div
					className={`group/nav relative flex items-start gap-2`}
					style={indentStyle}
				>
					{depth > 0 ? (
						<>
							<span
								className="pointer-events-none absolute -left-4 top-0 bottom-0 border-l border-dotted border-surface-divider/50"
								aria-hidden
							/>
							<span
								className="pointer-events-none absolute -left-4 top-1/2 w-4 -translate-y-1/2 border-t border-dotted border-surface-divider/45"
								aria-hidden
							/>
						</>
					) : null}
					{hasChildren ? (
						<button
							type="button"
							aria-expanded={isExpanded}
							aria-label={`${isExpanded ? "折叠" : "展开"}${node.name}`}
							onClick={() => toggleNode(node.id)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleNode(node.id);
								}
							}}
							className="mt-[2px] flex h-10 w-10 items-center justify-center border border-surface-divider/50 bg-surface-base/10 text-xs text-foreground-subtle transition-colors duration-[var(--motion-medium)] hover:border-accent-focus/40 hover:bg-accent-focus/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
						>
							<svg
								viewBox="0 0 24 24"
								className={`h-5 w-5 transition-transform duration-[var(--motion-medium)] ${
									isExpanded ? "rotate-90" : "rotate-0"
								}`}
								aria-hidden
							>
								<path
									d="M10 6l6 6-6 6"
									fill="none"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="1.8"
								/>
							</svg>
						</button>
					) : (
						<span className="mt-[2px] h-8 w-8" aria-hidden />
					)}
					<button
						type="button"
						onClick={() => goToCategory(node.id)}
						aria-current={isActive ? "page" : undefined}
						className={`group/nav-button relative flex min-h-[48px] flex-1 items-stretch overflow-hidden border border-surface-divider/50 bg-surface-base/10 text-left transition duration-[var(--motion-medium)] hover:border-accent-focus/40 hover:bg-accent-focus/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus ${
							isActive
								? "border-accent-focus/70 bg-accent-focus/15 text-foreground-primary shadow-[0_0_20px_rgba(255,176,120,0.18)]"
								: inTrail
								? "border-accent-focus/40 bg-accent-focus/8 text-foreground-primary/90"
								: "text-foreground-subtle"
						}`}
					>
						<NavBadge label={badgeLabel} />
						<span
							className={`pointer-events-none absolute inset-y-0 left-0 w-[4px] origin-top bg-status-warning transition duration-[var(--motion-medium)] ${warningBarClass}`}
							aria-hidden
						/>
					</button>
				</div>
				{hasChildren && isExpanded ? (
					<div className="relative mt-1 ml-[48px] flex flex-col gap-1 pl-2.5">
						<span
							className="pointer-events-none absolute -left-[24px] top-0 bottom-0 border-l border-dotted border-surface-divider/45"
							aria-hidden
						/>
						{node.children!.map((c) => (
							<CategoryItem key={c.id} node={c} depth={depth + 1} />
						))}
					</div>
				) : null}
			</div>
		);
	}

	function NavigationTree() {
		return (
			<nav
				id="primary-navigation"
				aria-label="主导航"
				className="flex flex-col gap-2.5 pb-6"
			>
				<button
					type="button"
					onClick={goHome}
					className={`group flex min-h-[48px] items-stretch overflow-hidden border border-surface-divider/50 bg-surface-base/10 text-left transition duration-[var(--motion-medium)] hover:border-accent-glow/50 hover:bg-accent-glow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus ${
						location.pathname === "/"
							? "border-accent-focus/70 bg-accent-focus/15 text-foreground-primary shadow-[0_0_20px_rgba(255,176,120,0.18)]"
							: "text-foreground-subtle"
					}`}
				>
					<NavBadge label="HQ" />
				</button>
				<div className="flex flex-col gap-2">
					{categories.map((c) => (
						<CategoryItem key={c.id} node={c} />
					))}
				</div>
			</nav>
		);
	}

	const desktopPanel = (
		<aside className="relative hidden h-full w-[300px] flex-shrink-0 overflow-hidden rounded-none border border-surface-divider/60 bg-surface-elevated/55 px-3 py-3 shadow-card backdrop-blur-2xl transition-all duration-[var(--motion-medium)] lg:flex">
			<div
				className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-15"
				aria-hidden
			/>
			<div className="relative flex h-full min-h-0 flex-col gap-3">
				<div className="flex items-center justify-between">
					<span className="text-[0.55rem] font-semibold uppercase tracking-[0.42em] text-foreground-muted">
						Nav
					</span>
				</div>
				<div className="relative flex-1 min-h-0 overflow-y-auto pr-1.5">
					<NavigationTree />
				</div>
			</div>
		</aside>
	);

	const drawer =
		drawerOpen && typeof document !== "undefined"
			? createPortal(
					<div className="fixed inset-0 z-50 flex">
						<button
							type="button"
							onClick={closeDrawer}
							className="absolute inset-0 bg-surface-base/65 backdrop-blur-2xl"
							aria-label="关闭导航抽屉"
						/>
						<div
							role="dialog"
							aria-modal="true"
							aria-label="导航抽屉"
							className="relative ml-auto flex h-full w-[min(360px,100%)] max-w-sm flex-col border-l border-surface-divider/60 bg-surface-elevated/95 shadow-[0_0_55px_rgba(0,0,0,0.45)]"
						>
							<div
								className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-20"
								aria-hidden
							/>
							<div className="relative flex items-center justify-between border-b border-surface-divider/60 px-5 py-4">
								<span className="text-xs font-semibold uppercase tracking-[0.45em] text-foreground-subtle">
									NAVIGATION
								</span>
								<button
									type="button"
									onClick={closeDrawer}
									className="flex h-9 w-9 items-center justify-center border border-surface-divider/50 bg-surface-base/10 text-foreground-muted transition-colors duration-[var(--motion-medium)] hover:border-accent-focus/50 hover:bg-accent-focus/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
									aria-label="关闭导航"
								>
									<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
										<path
											d="M18 6L6 18m0-12l12 12"
											stroke="currentColor"
											strokeWidth="1.6"
											strokeLinecap="round"
											strokeLinejoin="round"
											fill="none"
										/>
									</svg>
								</button>
							</div>
							<div className="relative flex-1 overflow-y-auto px-5 py-6">
								<NavigationTree />
							</div>
						</div>
					</div>,
					document.body
			  )
			: null;

	return (
		<>
			{desktopPanel}
			{drawer}
		</>
	);
}

export default Sidebar;
