import type {
	CategoryNode,
	FileMeta,
	IndexManifest,
	IndexStats,
} from "./types";

export interface ComposeIndexOptions {
	generatedAt?: Date;
	sourcePaths?: string[];
}

export function composeIndex(
	files: FileMeta[],
	categories: CategoryNode[],
	options: ComposeIndexOptions = {}
): IndexManifest {
	const generatedAt = (options.generatedAt || new Date()).toISOString();
	const sortedFiles = [...files].sort(fileComparator);
	const sortedCategories = [...categories].sort(categoryComparator);
	const stats = computeStats(sortedFiles, sortedCategories);

	return {
		generatedAt,
		files: sortedFiles,
		categories: sortedCategories,
		stats,
	};
}

function computeStats(
	files: FileMeta[],
	categories: CategoryNode[]
): IndexStats {
	return {
		totalFiles: files.length,
		totalCategories: categories.length,
		ignoredPaths: 0,
	};
}

function fileComparator(a: FileMeta, b: FileMeta): number {
	const categoryCompare = (a.categoryId || "").localeCompare(
		b.categoryId || "",
		"zh-Hans",
		{ sensitivity: "base" }
	);
	if (categoryCompare !== 0) return categoryCompare;
	return a.path.localeCompare(b.path, "zh-Hans", { sensitivity: "base" });
}

function categoryComparator(a: CategoryNode, b: CategoryNode): number {
	if (a.depth !== b.depth) {
		return a.depth - b.depth;
	}
	return a.path.localeCompare(b.path, "zh-Hans", { sensitivity: "base" });
}
