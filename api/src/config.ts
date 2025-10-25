import path from "path";
import { fileURLToPath } from "url";

export interface LoaderConfig {
	indexDirectories: string[];
	indexFileName: string;
	categoriesFileName: string;
	cacheMaxAgeMs: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
export const INDEX_DIRECTORIES = [
	path.resolve(PROJECT_ROOT, "api/public"),
	path.resolve(PROJECT_ROOT, "web/public"),
];

export const INDEX_FILE_NAME = "index.json";
export const CATEGORIES_FILE_NAME = "categories.json";

const DEFAULT_CACHE_AGE = Number(process.env.INDEX_CACHE_MAX_AGE_MS ?? 30_000);

export const defaultLoaderConfig: LoaderConfig = {
	indexDirectories: INDEX_DIRECTORIES,
	indexFileName: INDEX_FILE_NAME,
	categoriesFileName: CATEGORIES_FILE_NAME,
	cacheMaxAgeMs: Number.isFinite(DEFAULT_CACHE_AGE)
		? DEFAULT_CACHE_AGE
		: 30_000,
};

export type { LoaderConfig as IndexLoaderConfig };
