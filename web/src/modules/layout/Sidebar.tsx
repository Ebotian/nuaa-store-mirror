import { useEffect, useState, useCallback, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { mockAdapter } from "@services/adapters";

const STORAGE_KEY = "nuaa-sidebar-collapsed";

type CatNode = {
	id: string;
	name: string;
	path: string;
	parentId: string | null;
	fileCount: number;
	children?: CatNode[];
};

export function Sidebar() {
	const [collapsed, setCollapsed] = useState<boolean>(() => {
		try {
			return localStorage.getItem(STORAGE_KEY) === "true";
		} catch {
			return false;
		}
	});

	const [categories, setCategories] = useState<CatNode[]>([]);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const navigate = useNavigate();

	useEffect(() => {
		let mounted = true;

		// Try to load precomputed hierarchical categories.json first
		(async function load() {
			try {
				const res = await fetch("/mock-data/categories.json");
				if (res.ok) {
					const raw = await res.json();
					if (Array.isArray(raw)) {
						type RawCat = {
							id: string;
							name?: string;
							path?: string;
							parentId?: string | null;
							fileCount?: number;
						};
						const map = new Map<string, CatNode>();
						(raw as RawCat[]).forEach((c) =>
							map.set(c.id, {
								id: c.id,
								name: c.name ?? c.id,
								path: c.path ?? c.id,
								parentId: c.parentId ?? null,
								fileCount: c.fileCount ?? 0,
								children: [],
							})
						);
						// build tree
						const roots: CatNode[] = [];
						for (const node of map.values()) {
							if (node.parentId && map.has(node.parentId)) {
								map.get(node.parentId)!.children!.push(node);
							} else {
								roots.push(node);
							}
						}
						if (mounted) setCategories(roots);
						return;
					}
				}
			} catch {
				// ignore and fall back to adapter
			}

			// Fall back (older behavior) to adapter.fetchCategories (top-level only)
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
			} catch {
				if (mounted) setCategories([]);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, String(collapsed));
		} catch {
			/* ignore */
		}
	}, [collapsed]);

	const toggle = useCallback(() => setCollapsed((s) => !s), []);

	const onKeyToggle = useCallback(
		(e: KeyboardEvent<HTMLButtonElement>) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				toggle();
			}
		},
		[toggle]
	);

	const toggleNode = useCallback((id: string) => {
		setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
	}, []);

	const onNodeKey = useCallback(
		(e: KeyboardEvent, id: string) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				toggleNode(id);
			}
		},
		[toggleNode]
	);

	const goToCategory = useCallback(
		(id: string) => {
			// encode as path segment
			navigate(`/categories/${encodeURIComponent(id)}`);
		},
		[navigate]
	);

	function CategoryItem({
		node,
		depth = 0,
	}: {
		node: CatNode;
		depth?: number;
	}) {
		const hasChildren = !!(node.children && node.children.length > 0);
		const isExpanded = !!expanded[node.id];

		return (
			<div key={node.id} className="flex flex-col">
				<div className="flex items-center gap-2">
					{hasChildren ? (
						<button
							aria-expanded={isExpanded}
							onClick={() => toggleNode(node.id)}
							onKeyDown={(e) => onNodeKey(e, node.id)}
							className="rounded p-1 text-sm text-foreground-subtle hover:bg-accent-glow/6 focus-visible:outline-none"
						>
							{isExpanded ? "▾" : "▸"}
						</button>
					) : (
						<span className="inline-block w-4" aria-hidden />
					)}

					<button
						onClick={() => goToCategory(node.id)}
						className="flex-1 text-left rounded-2xl border border-transparent px-2 py-1 hover:border-accent-glow/40 hover:bg-accent-glow/6"
					>
						<span className="text-sm text-foreground-subtle">{node.name}</span>
						<span className="ml-2 text-xs text-foreground-muted">
							{node.fileCount}
						</span>
					</button>
				</div>

				{hasChildren && isExpanded ? (
					<div className="ml-4 mt-1 flex flex-col gap-1">
						{node.children!.map((c) => (
							<CategoryItem key={c.id} node={c} depth={depth + 1} />
						))}
					</div>
				) : null}
			</div>
		);
	}

	return (
		<aside
			className={`sticky top-28 h-fit flex-col gap-3 lg:flex transition-all duration-[var(--motion-medium)] ${
				collapsed ? "w-20" : "min-w-[240px]"
			}`}
			data-collapsed={String(collapsed)}
		>
			<div className="flex items-center justify-between px-3 py-2">
				<button
					type="button"
					aria-expanded={!collapsed}
					aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
					onClick={toggle}
					onKeyDown={onKeyToggle}
					className="rounded-md border border-transparent px-2 py-1 text-sm text-foreground-subtle hover:border-accent-glow/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
				>
					{collapsed ? (
						<svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
							<path
								d="M9 6l6 6-6 6"
								stroke="currentColor"
								strokeWidth="1.6"
								strokeLinecap="round"
								strokeLinejoin="round"
								fill="none"
							/>
						</svg>
					) : (
						<svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
							<path
								d="M15 6l-6 6 6 6"
								stroke="currentColor"
								strokeWidth="1.6"
								strokeLinecap="round"
								strokeLinejoin="round"
								fill="none"
							/>
						</svg>
					)}
				</button>
			</div>

			<nav className="flex flex-col gap-2 px-2" aria-label="主导航">
				<button
					onClick={() => navigate("/")}
					className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 hover:border-accent-glow/40 hover:bg-accent-glow/6"
				>
					<span
						className="inline-block h-5 w-5 rounded-sm bg-accent-glow/30"
						aria-hidden
					/>
					{!collapsed && (
						<span className="inline-block text-sm text-foreground-primary">
							首页
						</span>
					)}
				</button>

				<div className="flex flex-col">
					{categories.map((c) => (
						<CategoryItem key={c.id} node={c} />
					))}
				</div>
			</nav>
		</aside>
	);
}

export default Sidebar;
