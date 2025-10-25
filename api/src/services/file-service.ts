import type { FileMeta, IndexLoader } from "../loaders/index-loader.js";

export interface FileService {
	listAll(): Promise<FileMeta[]>;
	findById(fileId: string): Promise<FileMeta | undefined>;
	listFilesByCategory(categoryId: string): Promise<FileMeta[]>;
}

export function createFileService(loader: IndexLoader): FileService {
	const getManifestFiles = async () => {
		const manifest = await loader.loadManifest();
		return manifest.files ?? [];
	};

	const listAll = async () => getManifestFiles();

	const findById = async (fileId: string) => {
		const files = await getManifestFiles();
		return files.find((file) => file.id === fileId);
	};

	const listFilesByCategory = async (categoryId: string) => {
		const files = await getManifestFiles();
		return files.filter((file) => file.categoryId === categoryId);
	};

	return {
		listAll,
		findById,
		listFilesByCategory,
	};
}
