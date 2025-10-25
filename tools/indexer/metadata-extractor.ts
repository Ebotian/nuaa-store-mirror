import fs from "fs/promises";
import { Buffer } from "buffer";
import { lookup as lookupMime } from "mime-types";

import type {
	DirectoryEntry,
	FileMeta,
	Logger,
	MetadataOptions,
} from "./types";

const DEFAULT_OPTIONS: MetadataOptions = {
	rootDir: ".",
	defaultMime: "application/octet-stream",
	titleMaxLength: 120,
	digestMaxLength: 240,
};

const DEFAULT_LOGGER: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
};

const TEXT_EXTENSIONS = new Set([
	".txt",
	".md",
	".markdown",
	".csv",
	".json",
	".yaml",
	".yml",
	".log",
]);

const DEFAULT_ENCODING = "utf-8";
const DIGEST_SAMPLE_SIZE = 4096;

export interface ExtractMetadataResult {
	file?: FileMeta;
	ignored?: boolean;
}

/**
 * 将扫描到的文件条目转换为 FileMeta。目录会被忽略。
 */
export async function extractMetadata(
	entry: DirectoryEntry,
	options: Partial<MetadataOptions> = {},
	logger: Logger = DEFAULT_LOGGER
): Promise<ExtractMetadataResult> {
	if (entry.isDirectory) {
		return { ignored: true };
	}

	const mergedOptions: MetadataOptions = {
		...DEFAULT_OPTIONS,
		...options,
	};
	const mimeType = inferMime(
		entry.extension,
		mergedOptions.defaultMime || null
	);
	const categoryId = deriveCategoryId(entry);

	let title: string | undefined;
	let digest: string | undefined;
	if (shouldExtractText(entry.extension)) {
		try {
			const preview = await readTextPreview(
				entry.absolutePath,
				mergedOptions.titleMaxLength || DEFAULT_OPTIONS.titleMaxLength!,
				mergedOptions.digestMaxLength || DEFAULT_OPTIONS.digestMaxLength!
			);
			title = preview.title;
			digest = preview.digest;
		} catch (error) {
			logger.warn(
				"metadata:preview-failed",
				{ path: entry.relativePath },
				error
			);
		}
	}

	const meta: FileMeta = {
		id: entry.relativePath,
		name: entry.name,
		path: entry.relativePath,
		categoryId,
		ext: entry.extension,
		mime: mimeType,
		size: entry.stats.size,
		modifiedAt: new Date(entry.stats.mtimeMs).toISOString(),
	};

	if (title !== undefined) {
		meta.title = title;
	}
	if (digest !== undefined) {
		meta.digest = digest;
	}

	return { file: meta };
}

function inferMime(ext: string | null, fallback: string | null): string | null {
	if (!ext) return fallback;
	const mime = lookupMime(ext);
	if (typeof mime === "string") {
		return mime;
	}
	return fallback;
}

function deriveCategoryId(entry: DirectoryEntry): string {
	if (entry.segments.length <= 1) {
		return entry.segments[0] ?? "";
	}
	return entry.segments.slice(0, -1).join("/");
}

function shouldExtractText(ext: string | null): boolean {
	if (!ext) return false;
	return TEXT_EXTENSIONS.has(ext.toLowerCase());
}

async function readTextPreview(
	absPath: string,
	titleMaxLength: number,
	digestMaxLength: number
): Promise<{ title?: string; digest?: string }> {
	const fileHandle = await fs.open(absPath, "r");
	try {
		const buffer = Buffer.alloc(DIGEST_SAMPLE_SIZE);
		const { bytesRead } = await fileHandle.read(
			buffer,
			0,
			DIGEST_SAMPLE_SIZE,
			0
		);
		const text = buffer.slice(0, bytesRead).toString(DEFAULT_ENCODING);
		const result: { title?: string; digest?: string } = {};
		const previewTitle = extractTitle(text, titleMaxLength);
		if (previewTitle !== undefined) {
			result.title = previewTitle;
		}
		const previewDigest = extractDigest(text, digestMaxLength);
		if (previewDigest !== undefined) {
			result.digest = previewDigest;
		}
		return result;
	} finally {
		await fileHandle.close();
	}
}

function extractTitle(content: string, maxLength: number): string | undefined {
	const firstLine = content.split(/\r?\n/u)[0]?.trim();
	if (!firstLine) return undefined;
	return truncate(firstLine, maxLength);
}

function extractDigest(content: string, maxLength: number): string | undefined {
	const normalized = content.replace(/\s+/gu, " ").trim();
	if (!normalized) return undefined;
	return truncate(normalized, maxLength);
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 1)}…`;
}
