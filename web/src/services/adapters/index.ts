// Lightweight adapters for API access (no direct dependency on QueryClient here)

const RAW_FILES_BASE_URL =
	typeof import.meta !== "undefined" &&
	typeof import.meta.env?.VITE_FILES_BASE_URL === "string"
		? (import.meta.env.VITE_FILES_BASE_URL as string)
		: "/files";

const normalizeAssetBase = (() => {
	const trimmed = RAW_FILES_BASE_URL?.trim() ?? "";
	if (!trimmed || trimmed === "/") return "";
	return trimmed.replace(/\/+$/, "");
})();

const encodePathSegments = (input: string) =>
	input
		.split(/[\\/]+/)
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join("/");

const toExtension = (value?: string | null) => {
	if (!value) return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	return trimmed.startsWith(".") ? trimmed.slice(1) : trimmed;
};

const extensionFromName = (name?: string | null) => {
	if (!name) return null;
	const parts = name.split(".");
	if (parts.length <= 1) return null;
	return toExtension(parts.pop() ?? null);
};

const guessMimeFromExtension = (extension?: string | null) => {
	if (!extension) return null;
	switch (extension.toLowerCase()) {
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "bmp":
		case "webp":
			return `image/${
				extension.toLowerCase() === "jpg" ? "jpeg" : extension.toLowerCase()
			}`;
		case "svg":
			return "image/svg+xml";
		case "txt":
		case "log":
		case "md":
		case "markdown":
		case "csv":
		case "tsv":
		case "xml":
		case "yml":
		case "yaml":
		case "ini":
		case "cfg":
		case "conf":
			return "text/plain";
		case "json":
			return "application/json";
		default:
			return null;
	}
};

const isTextExtension = (extension?: string | null) => {
	if (!extension) return false;
	return new Set([
		"txt",
		"log",
		"md",
		"markdown",
		"csv",
		"tsv",
		"json",
		"xml",
		"yml",
		"yaml",
		"ini",
		"cfg",
		"conf",
		"html",
		"htm",
		"css",
		"scss",
		"less",
		"js",
		"jsx",
		"ts",
		"tsx",
		"java",
		"c",
		"cpp",
		"py",
		"go",
		"rs",
		"rb",
		"sh",
		"bat",
		"ps1",
	]).has(extension.toLowerCase());
};

const isImageExtension = (extension?: string | null) => {
	if (!extension) return false;
	return new Set(["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"]).has(
		extension.toLowerCase()
	);
};

const buildAssetUrl = (path?: string | null) => {
	if (!path) return null;
	const encoded = encodePathSegments(path);
	if (!encoded) return null;
	if (!normalizeAssetBase) {
		return `/${encoded}`;
	}
	return `${normalizeAssetBase}/${encoded}`;
};

const determinePreviewKind = (
	mime?: string | null,
	extension?: string | null
) => {
	if (mime?.startsWith("image/")) return "image" as const;
	if (mime?.startsWith("text/")) return "text" as const;
	if (mime === "application/json") return "text" as const;
	if (isImageExtension(extension)) return "image" as const;
	if (isTextExtension(extension)) return "text" as const;
	return null;
};

export type Category = { id: string; name: string };
export type FileItem = {
	id: string;
	name?: string | null;
	title?: string | null;
	path?: string | null;
	extension?: string | null;
	mime?: string | null;
	sizeBytes?: number | null;
	modifiedAt?: string | null;
	previewUrl?: string | null;
	downloadUrl?: string | null;
	supportsPreview?: boolean;
	previewKind?: "image" | "text";
};

const normalizeFileItem = (raw: unknown): FileItem => {
	if (!raw || typeof raw !== "object") {
		throw new Error("Invalid file payload");
	}
	const record = raw as Record<string, unknown>;
	const id = String(record.id ?? record.path ?? "");
	const name = record.name ? String(record.name) : null;
	const path = record.path ? String(record.path) : id;
	const extension = record.extension
		? toExtension(String(record.extension))
		: record.ext
		? toExtension(String(record.ext))
		: extensionFromName(name ?? id);
	const mime =
		record.mime && typeof record.mime === "string"
			? record.mime
			: guessMimeFromExtension(extension);
	const previewKind = determinePreviewKind(mime, extension);
	const downloadUrl =
		typeof record.downloadUrl === "string"
			? (record.downloadUrl as string)
			: buildAssetUrl(path);
	const previewUrl = previewKind
		? typeof record.previewUrl === "string"
			? (record.previewUrl as string)
			: downloadUrl
		: null;
	const sizeSource =
		typeof record.size === "number"
			? (record.size as number)
			: typeof record.sizeBytes === "number"
			? (record.sizeBytes as number)
			: null;
	const modifiedAt =
		record.modifiedAt && typeof record.modifiedAt === "string"
			? (record.modifiedAt as string)
			: null;
	return {
		id,
		name,
		title:
			record.title && typeof record.title === "string"
				? (record.title as string)
				: record.name && typeof record.name === "string"
				? (record.name as string)
				: null,
		path,
		extension,
		mime: mime ?? null,
		sizeBytes: sizeSource,
		modifiedAt,
		previewUrl,
		downloadUrl,
		supportsPreview: !!previewKind,
		previewKind: previewKind ?? undefined,
	};
};

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
			const payload = await wrappedFetch<unknown>(
				`/files?category=${encodeURIComponent(categoryId)}`
			);
			if (Array.isArray(payload)) {
				return payload.map((item) => normalizeFileItem(item));
			}
			if (payload && typeof payload === "object") {
				const record = payload as Record<string, unknown>;
				if (Array.isArray(record.data)) {
					return record.data.map((item) => normalizeFileItem(item));
				}
				if (Array.isArray(record.files)) {
					return record.files.map((item) => normalizeFileItem(item));
				}
			}
			return [];
		},
		async fetchFileDetail(fileId: string) {
			const payload = await wrappedFetch<unknown>(
				`/files/${encodeURIComponent(fileId)}`
			);
			if (payload && typeof payload === "object") {
				const record = payload as Record<string, unknown>;
				if (record.data) {
					return normalizeFileItem(record.data);
				}
			}
			return normalizeFileItem(payload);
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
		name?: string;
		title?: string;
		path?: string;
		category?: string;
		categoryId?: string;
		ext?: string;
		extension?: string;
		mime?: string;
		size?: number;
		sizeBytes?: number;
		modifiedAt?: string;
		previewUrl?: string;
		downloadUrl?: string;
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
				const prefix = categoryId ? `${categoryId}/` : "";
				return [
					normalizeFileItem({
						id: `${categoryId}-f-1`,
						name: "示例文件 1",
						title: "示例文件 1",
						path: `${prefix}示例文件-1.txt`,
						extension: "txt",
						mime: "text/plain",
						size: 0,
						modifiedAt: new Date().toISOString(),
					}),
					normalizeFileItem({
						id: `${categoryId}-f-2`,
						name: "示例文件 2",
						title: "示例文件 2",
						path: `${prefix}示例文件-2.txt`,
						extension: "txt",
						mime: "text/plain",
						size: 0,
						modifiedAt: new Date().toISOString(),
					}),
				];
			}
			return index.files
				.filter((it: MockFile) =>
					categoryId
						? (it.categoryId ?? it.category ?? "") === categoryId
						: true
				)
				.map((it: MockFile) =>
					normalizeFileItem({
						...it,
						path: it.path ?? it.id,
						extension: it.extension ?? it.ext,
						size: typeof it.size === "number" ? it.size : undefined,
						sizeBytes:
							typeof it.sizeBytes === "number" ? it.sizeBytes : undefined,
					})
				);
		},
		async fetchFileDetail(fileId: string) {
			const index = await loadFilesIndex();
			if (!index) {
				return normalizeFileItem({
					id: fileId,
					name: "示例详情",
					title: "示例详情",
					path: `${fileId}.txt`,
					extension: "txt",
					mime: "text/plain",
					size: 0,
					modifiedAt: new Date().toISOString(),
				});
			}
			const found = index.files.find((it: MockFile) => it.id === fileId);
			if (!found) {
				return normalizeFileItem({
					id: fileId,
					name: fileId,
					title: fileId,
					path: fileId,
				});
			}
			return normalizeFileItem({
				...found,
				path: found.path ?? found.id,
				extension: found.extension ?? found.ext,
				size: typeof found.size === "number" ? found.size : undefined,
				sizeBytes:
					typeof found.sizeBytes === "number" ? found.sizeBytes : undefined,
			});
		},
		async fetchCategoryDetail(categoryId: string) {
			return buildCategoryDetail(categoryId);
		},
	};
}
