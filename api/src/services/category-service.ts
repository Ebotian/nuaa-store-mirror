import type {
	CategoryNode,
	FileMeta,
	IndexLoader,
} from "../loaders/index-loader.js";
import type { FileService } from "./file-service.js";

export interface CategoryService {
	listCategories(): Promise<CategoryNode[]>;
	getCategoryById(categoryId: string): Promise<CategoryNode | undefined>;
	listFilesByCategory(
		categoryId: string
	): Promise<{ category: CategoryNode; files: FileMeta[] } | undefined>;
}

export function createCategoryService(
	loader: IndexLoader,
	fileService: FileService
): CategoryService {
	const listCategories = async () => loader.loadCategories();

	const getCategoryById = async (categoryId: string) => {
		const categories = await listCategories();
		return categories.find((category) => category.id === categoryId);
	};

	const listFilesByCategory = async (
		categoryId: string
	): Promise<{ category: CategoryNode; files: FileMeta[] } | undefined> => {
		const category = await getCategoryById(categoryId);
		if (!category) {
			return undefined;
		}
		const files = await fileService.listFilesByCategory(categoryId);
		return { category, files };
	};

	return {
		listCategories,
		getCategoryById,
		listFilesByCategory,
	};
}
