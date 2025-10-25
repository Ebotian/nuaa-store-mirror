// Lightweight adapters for API access (no direct dependency on QueryClient here)

export type Category = { id: string; name: string };
export type FileItem = { id: string; title: string; excerpt?: string };

export type CategoryRecord = {
	id: string;
	name: string;
	path: string;
	parentId: string | null;
	depth?: number;
	childrenCount?: number;
	fileCount?: number;
};

export type CategoryDetail = {
	category: CategoryRecord;
	breadcrumbs: CategoryRecord[];
	children: CategoryRecord[];
	stats: {
		directFileCount: number;
		reportedFileCount: number;
		childCount: number;
		latestUpdatedAt: string | null;
		totalSizeBytes: number;
	};
	filesSourceGeneratedAt: string | null;
};

export interface Adapter {
	fetchCategories(): Promise<Category[]>;
	fetchFiles(categoryId: string): Promise<FileItem[]>;
	fetchFileDetail(fileId: string): Promise<FileItem>;
	fetchCategoryDetail(categoryId: string): Promise<CategoryDetail>;
}

export function createAdapter(baseUrl = "/api"): Adapter {
	const wrappedFetch = async <T>(path: string, options?: RequestInit) => {
		const res = await fetch(`${baseUrl}${path}`, options);
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`API error ${res.status}: ${text}`);
		}
		return (await res.json()) as T;
	};

	return {
		async fetchCategories() {
			return wrappedFetch<Category[]>("/categories");
		},
		async fetchFiles(categoryId: string) {
			return wrappedFetch<FileItem[]>(
				`/files?category=${encodeURIComponent(categoryId)}`
			);
		},
		async fetchFileDetail(fileId: string) {
			return wrappedFetch<FileItem>(`/files/${encodeURIComponent(fileId)}`);
		},
		async fetchCategoryDetail(categoryId: string) {
			return wrappedFetch<CategoryDetail>(
				`/categories/${encodeURIComponent(categoryId)}`
			);
		},
	};
}

export function mockAdapter(): Adapter {
	type MockFile = {
		id: string;
		title: string;
		excerpt?: string;
		category?: string;
		categoryId?: string;
	};

	type FilesIndex = {
		generatedAt: string | null;
		files: MockFile[];
	};

	let filesCache: FilesIndex | null | undefined;
	let categoryCache: CategoryRecord[] | null | undefined;

	const loadCategoryIndex = async (): Promise<CategoryRecord[] | null> => {
		if (categoryCache !== undefined) return categoryCache;
		try {
			const res = await fetch("/mock-data/categories.json");
			if (!res.ok) {
				categoryCache = null;
				return categoryCache;
			}
			const body = await res.text();
			if (!body.trim()) {
				categoryCache = [];
				return categoryCache;
			}
			const parsed = JSON.parse(body);
			if (!Array.isArray(parsed)) {
				categoryCache = null;
				return categoryCache;
			}
			categoryCache = (parsed as CategoryRecord[]).map((c) => ({
				id: c.id,
				name: c.name ?? c.id,
				path: c.path ?? c.id,
				parentId: c.parentId ?? null,
				depth: c.depth,
				childrenCount: c.childrenCount,
				fileCount: c.fileCount,
			}));
			return categoryCache;
		} catch (error) {
			console.warn("解析 mock categories 数据失败", error);
			categoryCache = null;
			return categoryCache;
		}
	};

	const loadFilesIndex = async (): Promise<FilesIndex | null> => {
		if (filesCache !== undefined) return filesCache;
		try {
			const res = await fetch("/mock-data/files.json");
			if (!res.ok) {
				filesCache = null;
				return filesCache;
			}
			const body = await res.text();
			if (!body.trim()) {
				filesCache = { generatedAt: null, files: [] };
				return filesCache;
			}
			const parsed = JSON.parse(body);
			if (Array.isArray(parsed)) {
				filesCache = { generatedAt: null, files: parsed as MockFile[] };
				return filesCache;
			}
			if (parsed && typeof parsed === "object") {
				const filesArray = Array.isArray((parsed as { files?: unknown }).files)
					? (parsed as { files: MockFile[] }).files ?? []
					: [];
				const generatedAt =
					typeof (parsed as { generatedAt?: unknown }).generatedAt === "string"
						? (parsed as { generatedAt: string }).generatedAt ?? null
						: null;
				filesCache = { generatedAt, files: filesArray };
				return filesCache;
			}
			filesCache = null;
			return filesCache;
		} catch (error) {
			console.warn("解析 mock files 数据失败", error);
			filesCache = null;
			return filesCache;
		}
	};

	const buildCategoryDetail = async (
		categoryId: string
	): Promise<CategoryDetail> => {
		const [categoryIndexRaw, filesIndexRaw] = await Promise.all([
			loadCategoryIndex(),
			loadFilesIndex(),
		]);

		const categories = categoryIndexRaw ?? [];
		const filesIndex = filesIndexRaw ?? { generatedAt: null, files: [] };
		const categoryById = new Map(categories.map((c) => [c.id, c] as const));
		const categoryFromIndex = categoryById.get(categoryId) ?? null;
		const directFiles = filesIndex.files.filter((file) => {
			const fileCategory = file.categoryId ?? file.category ?? "";
			return fileCategory === categoryId;
		});

		const node: CategoryRecord = categoryFromIndex ?? {
			id: categoryId,
			name: categoryId,
			path: categoryId,
			parentId: null,
			fileCount: directFiles.length,
			childrenCount: 0,
		};

		const breadcrumbs: CategoryRecord[] = [];
		if (categoryFromIndex) {
			let currentParent = categoryFromIndex.parentId;
			while (currentParent) {
				const parent = categoryById.get(currentParent);
				if (!parent) break;
				breadcrumbs.unshift(parent);
				currentParent = parent.parentId;
			}
		}

		const children = categoryFromIndex
			? categories
					.filter((c) => c.parentId === categoryId)
					.sort(
						(a, b) =>
							(b.fileCount ?? 0) - (a.fileCount ?? 0) ||
							a.name.localeCompare(b.name, "zh-Hans-CN")
					)
			: [];

		const totalSizeBytes = directFiles.reduce((sum, file) => {
			const size = (file as { size?: number }).size ?? 0;
			return sum + size;
		}, 0);
		const latestUpdatedAt = directFiles.reduce<string | null>(
			(latest, file) => {
				const modified = (file as { modifiedAt?: string }).modifiedAt;
				if (!modified) return latest;
				const ts = Date.parse(modified);
				if (Number.isNaN(ts)) return latest;
				if (!latest) return modified;
				return ts > Date.parse(latest) ? modified : latest;
			},
			null
		);

		return {
			category: node,
			breadcrumbs,
			children,
			stats: {
				directFileCount: directFiles.length,
				reportedFileCount: categoryFromIndex?.fileCount ?? directFiles.length,
				childCount: categoryFromIndex?.childrenCount ?? children.length,
				latestUpdatedAt,
				totalSizeBytes,
			},
			filesSourceGeneratedAt: filesIndex.generatedAt,
		};
	};

	return {
		async fetchCategories() {
			const categories = await loadCategoryIndex();
			if (categories && categories.length) {
				return categories
					.filter((c) => c.parentId === null)
					.map((c) => ({ id: c.id, name: c.name }));
			}

			const fileIndex = await loadFilesIndex();
			if (!fileIndex) {
				return [
					{ id: "c-1", name: "课程" },
					{ id: "c-2", name: "资源" },
				];
			}
			const cats = new Map<string, string>();
			fileIndex.files.forEach((it: MockFile) => {
				const key = it.categoryId ?? it.category ?? "root";
				cats.set(key, key);
			});
			return Array.from(cats.keys()).map((k) => ({ id: k, name: k }));
		},
		async fetchFiles(categoryId: string) {
			const index = await loadFilesIndex();
			if (!index) {
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
			return index.files
				.filter((it: MockFile) =>
					categoryId
						? (it.categoryId ?? it.category ?? "") === categoryId
						: true
				)
				.map((it: MockFile) => ({
					id: it.id,
					title: it.title || it.id,
					excerpt: it.excerpt,
				}));
		},
		async fetchFileDetail(fileId: string) {
			const index = await loadFilesIndex();
			if (!index) return { id: fileId, title: "示例详情", excerpt: "详情文本" };
			const found = index.files.find((it: MockFile) => it.id === fileId);
			return found || { id: fileId, title: fileId, excerpt: undefined };
		},
		async fetchCategoryDetail(categoryId: string) {
			return buildCategoryDetail(categoryId);
		},
	};
}
