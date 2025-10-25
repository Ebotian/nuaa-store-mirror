// @ts-expect-error 使用 Node.js 内置模块，在编译环境中忽略类型解析
import fs from "fs/promises";
// @ts-expect-error 使用 Node.js 内置模块，在编译环境中忽略类型解析
import path from "path";

import type {
	DirectoryEntry,
	FileSystemStats,
	Logger,
	ScanOptions,
} from "./types";

const DEFAULT_SCAN_OPTIONS: ScanOptions = {
	ignore: [".git", "node_modules", "web", "api", ".vercel", ".next"],
	concurrency: 16,
};

const DEFAULT_LOGGER: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
};

interface PendingDirectory {
	absPath: string;
	relativePath: string;
	depth: number;
	segments: string[];
}

/**
 * 遍历指定目录，按深度优先顺序产出文件与目录的基础信息。
 */
export async function* scanDirectory(
	rootDir: string,
	options: Partial<ScanOptions> = {},
	logger: Logger = DEFAULT_LOGGER
): AsyncGenerator<DirectoryEntry> {
	const mergedOptions: ScanOptions = {
		...DEFAULT_SCAN_OPTIONS,
		...options,
	};
	const ignoreEntries = normalizeIgnoreList(mergedOptions.ignore);
	const rootAbsolute = path.resolve(rootDir);
	const queue: PendingDirectory[] = [
		{
			absPath: rootAbsolute,
			relativePath: "",
			depth: 0,
			segments: [],
		},
	];

	while (queue.length > 0) {
		const current = queue.pop();
		if (!current) break;

		let dirHandle: any;
		try {
			dirHandle = await fs.opendir(current.absPath);
		} catch (error) {
			logger.warn(
				"indexer:skip-directory",
				{ directory: current.relativePath || "." },
				error
			);
			continue;
		}

		for await (const dirent of dirHandle) {
			const { absPath, relPath } = resolvePaths(
				rootAbsolute,
				current.absPath,
				dirent.name
			);
			const normalizedRelPath = toPosix(relPath);
			if (
				shouldIgnore(
					ignoredEntryKey(normalizedRelPath, dirent.name),
					ignoreEntries
				)
			) {
				logger.debug("indexer:ignore", { path: normalizedRelPath });
				continue;
			}

			let stats: FileSystemStats;
			try {
				stats = await fs.lstat(absPath);
			} catch (error) {
				logger.warn("indexer:stat-failed", { path: normalizedRelPath }, error);
				continue;
			}

			const entry = createDirectoryEntry(
				dirent.name,
				absPath,
				normalizedRelPath,
				stats,
				current.depth + 1
			);
			yield entry;

			if (stats.isDirectory()) {
				queue.push({
					absPath,
					relativePath: normalizedRelPath,
					depth: entry.depth,
					segments: entry.segments,
				});
			}
		}
	}
}

export async function collectEntries(
	rootDir: string,
	options: Partial<ScanOptions> = {},
	logger: Logger = DEFAULT_LOGGER
): Promise<DirectoryEntry[]> {
	const results: DirectoryEntry[] = [];
	for await (const entry of scanDirectory(rootDir, options, logger)) {
		results.push(entry);
	}
	return results;
}

function createDirectoryEntry(
	name: string,
	absPath: string,
	relativePath: string,
	stats: FileSystemStats,
	depth: number
): DirectoryEntry {
	const segments = relativePathToSegments(relativePath);
	const extension = stats.isDirectory()
		? null
		: path.extname(name || "").replace(/^$/u, "") || null;
	return {
		absolutePath: absPath,
		relativePath,
		name,
		extension,
		isDirectory: stats.isDirectory(),
		depth,
		segments,
		stats,
	};
}

function relativePathToSegments(relativePath: string): string[] {
	if (!relativePath) return [];
	return relativePath.split("/").filter(Boolean);
}

function resolvePaths(
	rootAbsolute: string,
	parentAbsPath: string,
	entryName: string
): { absPath: string; relPath: string } {
	const absPath = path.resolve(parentAbsPath, entryName);
	const nativeRelative = path.relative(rootAbsolute, absPath);
	const relPath = nativeRelative === "" ? entryName : nativeRelative;
	return { absPath, relPath };
}

function toPosix(p: string): string {
	return p.split(path.sep).join("/");
}

function normalizeIgnoreList(ignore: string[]): string[] {
	return ignore
		.map((item) => toPosix(item.trim()))
		.filter((item) => item.length > 0);
}

function ignoredEntryKey(relativePath: string, name: string): string {
	return relativePath || name;
}

function shouldIgnore(entryKey: string, ignoreList: string[]): boolean {
	for (const ignore of ignoreList) {
		if (entryKey === ignore) {
			return true;
		}
		if (entryKey.startsWith(`${ignore}/`)) {
			return true;
		}
	}
	return false;
}
