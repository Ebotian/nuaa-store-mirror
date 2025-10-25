import { useQuery } from "@tanstack/react-query";

import { useAdapters } from "@app/providers/adaptersContext";
import type { FileItem } from "@services/adapters";

export function useFileDetail(fileId?: string) {
	const adapters = useAdapters();

	return useQuery<FileItem>({
		queryKey: ["file-detail", fileId],
		queryFn: async () => {
			if (!fileId) throw new Error("缺少文件标识");
			return adapters.fetchFileDetail(fileId);
		},
		enabled: !!fileId,
		staleTime: 5 * 60 * 1000,
	});
}

export type { FileItem } from "@services/adapters";
