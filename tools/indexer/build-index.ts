#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import { buildCategories } from "./category-builder";
import {
	DEFAULT_CATEGORIES_FILE_NAME,
	DEFAULT_FORMATS,
	DEFAULT_INDEX_FILE_NAME,
	DEFAULT_INDEX_OUTPUT_DIR,
	DEFAULT_METADATA_OPTIONS,
	DEFAULT_SCAN_OPTIONS,
} from "./constants";
import { composeIndex } from "./index-composer";
import { writeIndexFiles } from "./index-writer";
import { extractMetadata } from "./metadata-extractor";
import { scanDirectory } from "./scanner";
import type { BuildIndexOptions, FileMeta, Logger } from "./types";

const CLI_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT_DIR = path.resolve(CLI_DIR, "..", "..");

interface CliArguments extends BuildIndexOptions {
	indexFileName: string;
	categoriesFileName: string;
	help: boolean;
}

async function main() {
	const parsedArgs = parseArgs(process.argv.slice(2));
	if (parsedArgs.help) {
		printHelp();
		return;
	}

	const args = normalizeArgs(parsedArgs);
	const logger = createLogger(args.verbose);
	const start = Date.now();
	logger.info("indexer:start", {
		root: args.rootDir,
		output: args.outputDir,
		formats: args.formats,
	});

	try {
		const { files, ignored } = await gatherFiles(args, logger);
		const categories = buildCategories(files);
		const manifest = composeIndex(files, categories, {
			generatedAt: new Date(),
		});
		manifest.stats.ignoredPaths = ignored;
		manifest.stats.processingTimeMs = Date.now() - start;

		const writerResult = await writeIndexFiles(
			manifest,
			{
				outputDir: args.outputDir,
				indexFileName: args.indexFileName,
				categoriesFileName: args.categoriesFileName,
				pretty: args.pretty,
			},
			logger
		);

		await cleanupUnrequestedFormats(args, writerResult.writtenFiles, logger);

		logger.info("indexer:complete", {
			totalFiles: manifest.stats.totalFiles,
			totalCategories: manifest.stats.totalCategories,
			processingTimeMs: manifest.stats.processingTimeMs,
		});
	} catch (error) {
		logger.error("indexer:error", error);
		process.exitCode = 1;
	}
}

async function gatherFiles(
	args: CliArguments,
	logger: Logger
): Promise<{ files: FileMeta[]; ignored: number }> {
	const files: FileMeta[] = [];
	let ignored = 0;

	const scanOptions = {
		ignore: DEFAULT_SCAN_OPTIONS.ignore,
		concurrency: DEFAULT_SCAN_OPTIONS.concurrency,
	};

	const metadataOptions = {
		...DEFAULT_METADATA_OPTIONS,
		rootDir: args.rootDir,
	};

	for await (const entry of scanDirectory(args.rootDir, scanOptions, logger)) {
		const { file, ignored: isIgnored } = await extractMetadata(
			entry,
			metadataOptions,
			logger
		);
		if (file) {
			files.push(file);
		} else if (isIgnored) {
			ignored += 1;
		}
	}

	return { files, ignored };
}

async function cleanupUnrequestedFormats(
	args: CliArguments,
	writtenFiles: string[],
	logger: Logger
) {
	const toRemove: string[] = [];
	if (!args.formats.includes("index")) {
		const file = writtenFiles.find(
			(item) => path.basename(item) === args.indexFileName
		);
		if (file) toRemove.push(file);
	}
	if (!args.formats.includes("categories")) {
		const file = writtenFiles.find(
			(item) => path.basename(item) === args.categoriesFileName
		);
		if (file) toRemove.push(file);
	}

	await Promise.all(
		toRemove.map(async (file) => {
			await fs.rm(file, { force: true });
			logger.info("indexer:remove", { file });
		})
	);
}

function parseArgs(argv: string[]): CliArguments {
	const options: CliArguments = {
		rootDir: DEFAULT_ROOT_DIR,
		outputDir: DEFAULT_INDEX_OUTPUT_DIR,
		formats: [...DEFAULT_FORMATS],
		pretty: true,
		verbose: false,
		indexFileName: DEFAULT_INDEX_FILE_NAME,
		categoriesFileName: DEFAULT_CATEGORIES_FILE_NAME,
		help: false,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const raw = argv[i];
		if (!raw) {
			continue;
		}

		if (raw === "--help" || raw === "-h") {
			options.help = true;
			continue;
		}

		const parsed = splitOption(raw, argv, i);
		if (parsed.consumedNext) {
			i += 1;
		}

		if (parsed.flag === "--root" && "value" in parsed) {
			const candidate = parsed.value.trim();
			if (candidate.length > 0) {
				options.rootDir = path.resolve(candidate);
			}
			continue;
		}
		if (parsed.flag === "--out" && "value" in parsed) {
			const candidate = parsed.value.trim();
			if (candidate.length > 0) {
				options.outputDir = candidate;
			}
			continue;
		}
		if (parsed.flag === "--index-file" && "value" in parsed) {
			if (parsed.value.length > 0) {
				options.indexFileName = parsed.value;
			}
			continue;
		}
		if (parsed.flag === "--categories-file" && "value" in parsed) {
			if (parsed.value.length > 0) {
				options.categoriesFileName = parsed.value;
			}
			continue;
		}
		if (parsed.flag === "--formats" && "value" in parsed) {
			const candidates = parsed.value
				.split(",")
				.map((token) => token.trim().toLowerCase())
				.filter(
					(token): token is "index" | "categories" =>
						token === "index" || token === "categories"
				);
			if (candidates.length > 0) {
				options.formats = candidates;
			}
			continue;
		}
		if (parsed.flag === "--pretty") {
			options.pretty = true;
			continue;
		}
		if (parsed.flag === "--no-pretty") {
			options.pretty = false;
			continue;
		}
		if (parsed.flag === "--verbose" || parsed.flag === "-v") {
			options.verbose = true;
		}
	}

	if (options.formats.length === 0) {
		options.formats = [...DEFAULT_FORMATS];
	}

	return options;
}

type ParsedOption =
	| { flag: string; consumedNext: boolean }
	| { flag: string; value: string; consumedNext: boolean };

function splitOption(arg: string, argv: string[], index: number): ParsedOption {
	const eqIndex = arg.indexOf("=");
	if (eqIndex >= 0) {
		const flag = arg.slice(0, eqIndex);
		const value = arg.slice(eqIndex + 1);
		if (value.length > 0) {
			return { flag, value, consumedNext: false };
		}
		return { flag, consumedNext: false };
	}
	const next = argv[index + 1];
	if (typeof next === "string" && next.length > 0 && !next.startsWith("--")) {
		return { flag: arg, value: next, consumedNext: true };
	}
	return { flag: arg, consumedNext: false };
}

function normalizeArgs(args: CliArguments): CliArguments {
	const outputDir = path.isAbsolute(args.outputDir)
		? args.outputDir
		: path.resolve(args.rootDir, args.outputDir);
	return { ...args, outputDir };
}

function createLogger(verbose: boolean): Logger {
	const minLevel = verbose ? 0 : 1; // 0=debug,1=info
	return {
		debug: (...args: unknown[]) => {
			if (minLevel <= 0) console.debug("[debug]", ...args);
		},
		info: (...args: unknown[]) => {
			if (minLevel <= 1) console.info("[info]", ...args);
		},
		warn: (...args: unknown[]) => {
			console.warn("[warn]", ...args);
		},
		error: (...args: unknown[]) => {
			console.error("[error]", ...args);
		},
	};
}

function printHelp() {
	const helpMessage =
		`NUAA Store Index Builder\n\n` +
		`Usage: build-index [options]\n\n` +
		`Options:\n` +
		`  --root <path>             指定扫描根目录 (默认: 项目根目录 ${DEFAULT_ROOT_DIR})\n` +
		`  --out <path>              输出目录 (默认: ${DEFAULT_INDEX_OUTPUT_DIR}，相对于 --root)\n` +
		`  --formats <list>          逗号分隔的输出文件列表 (index,categories)\n` +
		`  --index-file <name>       index.json 文件名 (默认: ${DEFAULT_INDEX_FILE_NAME})\n` +
		`  --categories-file <name>  categories.json 文件名 (默认: ${DEFAULT_CATEGORIES_FILE_NAME})\n` +
		`  --pretty / --no-pretty    是否使用缩进格式化 JSON (默认: pretty)\n` +
		`  --verbose                 输出调试日志\n` +
		`  --help                    显示本帮助信息\n`;
	console.log(helpMessage);
}

main();
