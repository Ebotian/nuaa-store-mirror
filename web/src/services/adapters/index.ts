// Lightweight adapters for API access (no direct dependency on QueryClient here)

export type Category = { id: string; name: string };
export type FileItem = { id: string; title: string; excerpt?: string };

export interface Adapter {
	fetchCategories(): Promise<Category[]>;
	fetchFiles(categoryId: string): Promise<FileItem[]>;
	fetchFileDetail(fileId: string): Promise<FileItem>;
}

export function createAdapter(baseUrl = "/api"): Adapter {
	const wrappedFetch = async (path: string, options?: RequestInit) => {
		const res = await fetch(`${baseUrl}${path}`, options);
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`API error ${res.status}: ${text}`);
		}
		return res.json();
	};

	return {
		async fetchCategories() {
			return wrappedFetch("/categories");
		},
		async fetchFiles(categoryId: string) {
			return wrappedFetch(`/files?category=${encodeURIComponent(categoryId)}`);
		},
		async fetchFileDetail(fileId: string) {
			return wrappedFetch(`/files/${encodeURIComponent(fileId)}`);
		},
	};
}

export function mockAdapter(): Adapter {
	type MockFile = {
		id: string;
		title: string;
		excerpt?: string;
		category?: string;
	};

	type MockCategory = {
		id: string;
		name: string;
		path: string;
		parentId: string | null;
		fileCount: number;
	};
	let cached: MockFile[] | null | undefined;
	const loadData = async (): Promise<MockFile[] | null> => {
		if (cached !== undefined) return cached;
		try {
			const res = await fetch("/mock-data/files.json");
			if (!res.ok) {
				cached = null;
				return cached;
			}
			const json = await res.json();
			cached = Array.isArray(json) ? (json as MockFile[]) : null;
			return cached;
		} catch {
			cached = null;
			return cached;
		}
	};

	return {
		async fetchCategories() {
			// Prefer a precomputed categories.json if present
			try {
				const res = await fetch("/mock-data/categories.json");
				if (res.ok) {
					const cats = (await res.json()) as MockCategory[] | unknown;
					// return top-level categories (parentId === null)
					return Array.isArray(cats)
						? (cats as MockCategory[])
								.filter((c) => c.parentId === null)
								.map((c) => ({ id: c.id, name: c.name }))
						: [];
				}
			} catch {
				// ignore and fall back
			}

			const d = await loadData();
			if (!d) {
				return [
					{ id: "c-1", name: "课程" },
					{ id: "c-2", name: "资源" },
				];
			}
			const cats = new Map<string, string>();
			d.forEach((it: MockFile) =>
				cats.set(it.category || "root", it.category || "root")
			);
			return Array.from(cats.keys()).map((k) => ({ id: k, name: k }));
		},
		async fetchFiles(categoryId: string) {
			const d = await loadData();
			if (!d) {
				return [
					{
						id: `${categoryId}-f-1`,
						title: "示例文件 1",
						excerpt: "这是示例文件",
					},
					{
						id: `${categoryId}-f-2`,
						title: "示例文件 2",
						excerpt: "这是示例文件",
					},
				];
			}
			return d
				.filter((it: MockFile) =>
					categoryId ? it.category === categoryId : true
				)
				.map((it: MockFile) => ({
					id: it.id,
					title: it.title || it.id,
					excerpt: it.excerpt,
				}));
		},
		async fetchFileDetail(fileId: string) {
			const d = await loadData();
			if (!d) return { id: fileId, title: "示例详情", excerpt: "详情文本" };
			const found = d.find((it: MockFile) => it.id === fileId);
			return found || { id: fileId, title: fileId, excerpt: undefined };
		},
	};
}
