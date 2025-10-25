import type { CategoryBuilderOptions, CategoryNode, FileMeta } from "./types";

const DEFAULT_OPTIONS: CategoryBuilderOptions = {
	includeEmpty: false,
};

interface CategoryAccumulator {
	node: CategoryNode;
}

export function buildCategories(
	files: FileMeta[],
	options: CategoryBuilderOptions = DEFAULT_OPTIONS
): CategoryNode[] {
	const merged = { ...DEFAULT_OPTIONS, ...options };
	const map = new Map<string, CategoryAccumulator>();
	for (const file of files) {
		const segments = deriveSegments(file);
		if (segments.length === 0) {
			continue;
		}
		let parentId: string | null = null;
		for (let index = 0; index < segments.length; index += 1) {
			const slice = segments.slice(0, index + 1);
			const id = slice.join("/");
			const segmentName = segments[index];
			if (!segmentName) {
				continue;
			}
			let acc = map.get(id);
			if (acc === undefined) {
				acc = {
					node: {
						id,
						name: segmentName,
						path: id,
						parentId,
						depth: index,
						childrenCount: 0,
						fileCount: 0,
					},
				};
				map.set(id, acc);
			}
			acc.node.fileCount += index === segments.length - 1 ? 1 : 0;
			parentId = id;
		}
	}

	for (const acc of map.values()) {
		const parentId = acc.node.parentId;
		if (!parentId) continue;
		const parent = map.get(parentId);
		if (parent) {
			parent.node.childrenCount += 1;
		}
	}

	let categories = Array.from(map.values()).map((item) => item.node);
	if (!merged.includeEmpty) {
		categories = categories.filter(
			(category) => category.fileCount > 0 || category.childrenCount > 0
		);
	}

	return categories.sort(categoryComparator);
}

function deriveSegments(file: FileMeta): string[] {
	if (file.categoryId) {
		return file.categoryId.split("/").filter(Boolean);
	}
	const segments = file.path.split("/").filter(Boolean);
	segments.pop();
	return segments;
}

function categoryComparator(a: CategoryNode, b: CategoryNode): number {
	if (a.depth !== b.depth) {
		return a.depth - b.depth;
	}
	return a.path.localeCompare(b.path, "zh-Hans", { sensitivity: "base" });
}
