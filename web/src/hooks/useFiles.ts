import { useQuery } from "@tanstack/react-query";
import { useAdapters } from "@app/providers/adaptersContext";

export function useFiles(categoryId?: string) {
	const adapters = useAdapters();

	return useQuery({
		queryKey: ["files", categoryId ?? "all"],
		queryFn: () => adapters.fetchFiles(categoryId ?? ""),
		enabled: !!adapters,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});
}
