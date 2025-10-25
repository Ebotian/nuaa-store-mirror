import type { MetadataOptions, ScanOptions } from "./types";

export const DEFAULT_IGNORE_LIST: string[] = [
	".git",
	".github",
	".vscode",
	"node_modules",
	"web/node_modules",
	"api/node_modules",
	"web/dist",
	"api/dist",
	".vercel",
	".next",
	".cache",
	".DS_Store",
];

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
	ignore: DEFAULT_IGNORE_LIST,
	concurrency: 16,
};

export const DEFAULT_METADATA_OPTIONS: MetadataOptions = {
	rootDir: ".",
	defaultMime: "application/octet-stream",
	titleMaxLength: 120,
	digestMaxLength: 240,
};

export const DEFAULT_INDEX_OUTPUT_DIR = "web/public";
export const DEFAULT_INDEX_FILE_NAME = "index.json";
export const DEFAULT_CATEGORIES_FILE_NAME = "categories.json";

export const SUPPORTED_TEXT_EXTENSIONS = [
	".txt",
	".md",
	".markdown",
	".rst",
	".csv",
	".json",
	".yaml",
	".yml",
	".log",
];

export const MIME_OVERRIDES: Record<string, string> = {
	".md": "text/markdown",
	".markdown": "text/markdown",
	".yml": "text/yaml",
	".yaml": "text/yaml",
	".csv": "text/csv",
};

export const DEFAULT_FORMATS: Array<"index" | "categories"> = [
	"index",
	"categories",
];

export const CLI_DESCRIPTION = "NUAA store index builder";
