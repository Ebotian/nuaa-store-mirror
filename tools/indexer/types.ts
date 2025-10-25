export type MimeType = string;

/**
 * 描述文件系统遍历过程中发现的一个节点。
 * 所有路径均使用 POSIX 风格（`/` 分隔），并相对于扫描根目录。
 */
export interface DirectoryEntry {
	absolutePath: string;
	relativePath: string;
	name: string;
	extension: string | null;
	isDirectory: boolean;
	depth: number;
	segments: string[];
	stats: FileSystemStats;
}

export interface FileSystemStats {
	size: number;
	mtimeMs: number;
	birthtimeMs: number;
	ctimeMs: number;
	atimeMs: number;
	isDirectory(): boolean;
	isFile(): boolean;
}

/**
 * 从 DirectoryEntry 抽取出的结构化文件元数据。
 */
export interface FileMeta {
	id: string;
	name: string;
	path: string;
	categoryId: string;
	ext: string | null;
	mime: MimeType | null;
	size: number;
	modifiedAt: string;
	title?: string;
	digest?: string;
	previewUrl?: string;
	downloadUrl?: string;
}

/**
 * 分类节点信息，用于构建侧边栏或层级导航。
 */
export interface CategoryNode {
	id: string;
	name: string;
	path: string;
	parentId: string | null;
	depth: number;
	childrenCount: number;
	fileCount: number;
}

/**
 * CLI 合成后的索引结构。
 */
export interface IndexManifest {
	generatedAt: string;
	files: FileMeta[];
	categories: CategoryNode[];
	stats: IndexStats;
}

export interface IndexStats {
	totalFiles: number;
	totalCategories: number;
	ignoredPaths: number;
	processingTimeMs?: number;
}

/**
 * 扫描阶段的可选配置。
 */
export interface ScanOptions {
	ignore: string[];
	concurrency: number;
}

/**
 * 元数据提取阶段的配置。
 */
export interface MetadataOptions {
	rootDir: string;
	defaultMime?: MimeType;
	titleMaxLength?: number;
	digestMaxLength?: number;
}

/**
 * 分类构建阶段的配置。
 */
export interface CategoryBuilderOptions {
	includeEmpty?: boolean;
}

/**
 * 索引写入阶段的配置。
 */
export interface IndexWriterOptions {
	outputDir: string;
	indexFileName: string;
	categoriesFileName: string;
	pretty?: boolean;
}

/**
 * CLI 主入口的选项聚合。
 */
export interface BuildIndexOptions {
	rootDir: string;
	outputDir: string;
	formats: Array<"index" | "categories">;
	pretty: boolean;
	verbose: boolean;
}

/**
 * 索引写入阶段返回的结果摘要。
 */
export interface WriterResult {
	writtenFiles: string[];
	manifest: IndexManifest;
}

/**
 * 模块间共享的日志方法签名。
 */
export interface Logger {
	debug: (...args: unknown[]) => void;
	info: (...args: unknown[]) => void;
	warn: (...args: unknown[]) => void;
	error: (...args: unknown[]) => void;
}
