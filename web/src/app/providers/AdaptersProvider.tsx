import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { createAdapter, mockAdapter, type Adapter } from "@services/adapters";
import { AdaptersContext } from "./adaptersContext";

export function AdaptersProvider({ children }: PropsWithChildren) {
	const adapter = useMemo<Adapter>(() => {
		const envFlag = import.meta.env.VITE_USE_MOCK;
		const shouldForceMock = envFlag === "true";
		const shouldPreferMockInDev = import.meta.env.DEV && envFlag !== "false";

		if (shouldForceMock || shouldPreferMockInDev) {
			return mockAdapter();
		}

		const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
		const apiAdapter = createAdapter(apiBase);
		const fallbackAdapter = mockAdapter();

		// Wrap with graceful fallback so SyntaxError from non-JSON responses promotes clearer message
		return {
			async fetchCategories() {
				try {
					return await apiAdapter.fetchCategories();
				} catch (error) {
					if (error instanceof SyntaxError) {
						console.warn("API 返回的分类数据无法解析，退回本地 mock", error);
						return fallbackAdapter.fetchCategories();
					}
					throw error;
				}
			},
			async fetchFiles(categoryId: string) {
				try {
					return await apiAdapter.fetchFiles(categoryId);
				} catch (error) {
					if (error instanceof SyntaxError) {
						console.warn("API 返回的文件列表无法解析，退回本地 mock", error);
						return fallbackAdapter.fetchFiles(categoryId);
					}
					throw error;
				}
			},
			async fetchFileDetail(fileId: string) {
				try {
					return await apiAdapter.fetchFileDetail(fileId);
				} catch (error) {
					if (error instanceof SyntaxError) {
						console.warn("API 返回的文件详情无法解析，退回本地 mock", error);
						return fallbackAdapter.fetchFileDetail(fileId);
					}
					throw error;
				}
			},
			async fetchCategoryDetail(categoryId: string) {
				try {
					return await apiAdapter.fetchCategoryDetail(categoryId);
				} catch (error) {
					if (error instanceof SyntaxError) {
						console.warn("API 返回的分类详情无法解析，退回本地 mock", error);
						return fallbackAdapter.fetchCategoryDetail(categoryId);
					}
					throw error;
				}
			},
		};
	}, []);

	return (
		<AdaptersContext.Provider value={adapter}>
			{children}
		</AdaptersContext.Provider>
	);
}

export default AdaptersProvider;
