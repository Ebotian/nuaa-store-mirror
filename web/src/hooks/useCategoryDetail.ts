import { useQuery } from "@tanstack/react-query";

import { useAdapters } from "@app/providers/adaptersContext";
import type { CategoryDetail } from "@services/adapters";

export function useCategoryDetail(categoryId?: string) {
	const adapters = useAdapters();

	return useQuery<CategoryDetail>({
		queryKey: ["category-detail", categoryId],
		queryFn: async () => {
			if (!categoryId) throw new Error("缺少分类标识");
			return adapters.fetchCategoryDetail(categoryId);
		},
		enabled: !!categoryId,
		staleTime: 5 * 60 * 1000,
	});
}

export type { CategoryDetail } from "@services/adapters";
