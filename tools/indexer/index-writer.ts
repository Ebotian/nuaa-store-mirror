import fs from "fs/promises";
import path from "path";

import type {
	IndexManifest,
	IndexWriterOptions,
	Logger,
	WriterResult,
} from "./types";

import {
	DEFAULT_CATEGORIES_FILE_NAME,
	DEFAULT_INDEX_FILE_NAME,
	DEFAULT_INDEX_OUTPUT_DIR,
} from "./constants";

const DEFAULT_LOGGER: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
};

const DEFAULT_OPTIONS: IndexWriterOptions = {
	outputDir: DEFAULT_INDEX_OUTPUT_DIR,
	indexFileName: DEFAULT_INDEX_FILE_NAME,
	categoriesFileName: DEFAULT_CATEGORIES_FILE_NAME,
	pretty: true,
};

export async function writeIndexFiles(
	manifest: IndexManifest,
	options: Partial<IndexWriterOptions> = {},
	logger: Logger = DEFAULT_LOGGER
): Promise<WriterResult> {
	const merged = {
		...DEFAULT_OPTIONS,
		...options,
	} satisfies IndexWriterOptions;
	const outputDir = path.resolve(merged.outputDir);

	await fs.mkdir(outputDir, { recursive: true });

	const indexFilePath = path.join(outputDir, merged.indexFileName);
	const categoriesFilePath = path.join(outputDir, merged.categoriesFileName);

	const stringify = createStringify(merged.pretty);
	await Promise.all([
		writeJson(indexFilePath, { ...manifest, categories: undefined }, stringify),
		writeJson(categoriesFilePath, manifest.categories, stringify),
	]);

	logger.info("indexer:write-complete", {
		outputDir,
		files: [indexFilePath, categoriesFilePath],
		stats: manifest.stats,
	});

	return {
		writtenFiles: [indexFilePath, categoriesFilePath],
		manifest,
	};
}

function createStringify(
	pretty: boolean | undefined
): (value: unknown) => string {
	return (value) => JSON.stringify(value, null, pretty ? 2 : 0);
}

async function writeJson(
	filePath: string,
	data: unknown,
	stringify: (value: unknown) => string
) {
	const serialized = `${stringify(data)}\n`;
	await fs.writeFile(filePath, serialized, "utf-8");
}
