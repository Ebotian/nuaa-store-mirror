import fs from "fs/promises";
import { constants as FS_CONSTANTS } from "fs";
import path from "path";

import { defaultLoaderConfig, type LoaderConfig } from "../config.js";

export interface FileMeta {
	id: string;
	name: string;
	path: string;
	categoryId: string;
	ext: string | null;
	mime: string | null;
	size: number;
	modifiedAt: string;
	title?: string;
	digest?: string;
	previewUrl?: string;
	downloadUrl?: string;
}

export interface CategoryNode {
	id: string;
	name: string;
	path: string;
	parentId: string | null;
	depth: number;
	childrenCount: number;
	fileCount: number;
}

export interface IndexStats {
	totalFiles: number;
	totalCategories: number;
	ignoredPaths?: number;
	processingTimeMs?: number;
}

export interface IndexManifest {
	generatedAt: string;
	files: FileMeta[];
	categories: CategoryNode[];
	stats?: IndexStats;
}

interface CacheEntry<T> {
	value: T;
	sourcePath: string;
	mtimeMs: number;
	loadedAt: number;
}

export interface IndexLoader {
	loadManifest(force?: boolean): Promise<IndexManifest>;
	loadCategories(force?: boolean): Promise<CategoryNode[]>;
}

interface LoaderState {
	manifest: CacheEntry<IndexManifest> | null;
	categories: CacheEntry<CategoryNode[]> | null;
	manifestPromise: Promise<CacheEntry<IndexManifest>> | null;
	categoriesPromise: Promise<CacheEntry<CategoryNode[]>> | null;
}

const isPositiveNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value) && value >= 0;

export function createIndexLoader(
	configOverrides: Partial<LoaderConfig> = {}
): IndexLoader {
	const config = {
		...defaultLoaderConfig,
		...configOverrides,
	} satisfies LoaderConfig;
	const state: LoaderState = {
		manifest: null,
		categories: null,
		manifestPromise: null,
		categoriesPromise: null,
	};

	const resolveFilePath = async (fileName: string): Promise<string | null> => {
		for (const dir of config.indexDirectories) {
			const candidate = path.resolve(dir, fileName);
			try {
				await fs.access(candidate, FS_CONSTANTS.R_OK);
				return candidate;
			} catch (error) {
				// continue searching
			}
		}
		return null;
	};

	const shouldReuseCache = (
		entry: CacheEntry<unknown> | null,
		filePath: string
	) => {
		if (!entry) return false;
		if (entry.sourcePath !== filePath) return false;
		if (!isPositiveNumber(config.cacheMaxAgeMs) || config.cacheMaxAgeMs === 0) {
			return false;
		}
		return Date.now() - entry.loadedAt < config.cacheMaxAgeMs;
	};

	const loadManifestEntry = async (
		force = false
	): Promise<CacheEntry<IndexManifest>> => {
		if (state.manifestPromise) {
			return state.manifestPromise;
		}

		state.manifestPromise = (async () => {
			const filePath = await resolveFilePath(config.indexFileName);
			if (!filePath) {
				throw new Error(
					`Unable to locate index file '${
						config.indexFileName
					}' in directories: ${config.indexDirectories.join(", ")}`
				);
			}

			if (!force && shouldReuseCache(state.manifest, filePath)) {
				const cached = state.manifest as CacheEntry<IndexManifest>;
				state.manifestPromise = null;
				return cached;
			}

			const [raw, stats] = await Promise.all([
				fs.readFile(filePath, "utf-8"),
				fs.stat(filePath),
			]);
			const manifest = JSON.parse(raw) as IndexManifest;
			const entry: CacheEntry<IndexManifest> = {
				value: manifest,
				sourcePath: filePath,
				mtimeMs: stats.mtimeMs,
				loadedAt: Date.now(),
			};
			state.manifest = entry;
			state.manifestPromise = null;
			return entry;
		})();

		try {
			return await state.manifestPromise;
		} finally {
			state.manifestPromise = null;
		}
	};

	const loadCategoriesEntry = async (
		force = false
	): Promise<CacheEntry<CategoryNode[]>> => {
		if (state.categoriesPromise) {
			return state.categoriesPromise;
		}

		state.categoriesPromise = (async () => {
			const categoriesPath = await resolveFilePath(config.categoriesFileName);
			if (categoriesPath) {
				if (!force && shouldReuseCache(state.categories, categoriesPath)) {
					const cached = state.categories as CacheEntry<CategoryNode[]>;
					state.categoriesPromise = null;
					return cached;
				}
				const [raw, stats] = await Promise.all([
					fs.readFile(categoriesPath, "utf-8"),
					fs.stat(categoriesPath),
				]);
				const categories = JSON.parse(raw) as CategoryNode[];
				const entry: CacheEntry<CategoryNode[]> = {
					value: categories,
					sourcePath: categoriesPath,
					mtimeMs: stats.mtimeMs,
					loadedAt: Date.now(),
				};
				state.categories = entry;
				state.categoriesPromise = null;
				return entry;
			}

			const manifestEntry = await loadManifestEntry(force);
			const entry: CacheEntry<CategoryNode[]> = {
				value: manifestEntry.value.categories ?? [],
				sourcePath: manifestEntry.sourcePath,
				mtimeMs: manifestEntry.mtimeMs,
				loadedAt: Date.now(),
			};
			state.categories = entry;
			state.categoriesPromise = null;
			return entry;
		})();

		try {
			return await state.categoriesPromise;
		} finally {
			state.categoriesPromise = null;
		}
	};

	return {
		loadManifest: async (force = false) => {
			const entry = await loadManifestEntry(force);
			return entry.value;
		},
		loadCategories: async (force = false) => {
			const entry = await loadCategoriesEntry(force);
			return entry.value;
		},
	};
}

export type { LoaderConfig } from "../config.js";
