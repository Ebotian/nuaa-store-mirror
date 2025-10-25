import { useFiles } from "@/hooks/useFiles";
import { FileCard } from "./FileCard";
import { SkeletonCard } from "./SkeletonCard";

export default function FileList({ categoryId }: { categoryId?: string }) {
	const { data, isLoading, isError } = useFiles(categoryId);

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<SkeletonCard key={i} />
				))}
			</div>
		);
	}

	if (isError) {
		return <div className="text-foreground-muted">加载文件时出错</div>;
	}

	if (!data || data.length === 0) {
		return <div className="text-foreground-muted">没有找到文件</div>;
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{data.map((file) => (
				<FileCard
					key={file.id}
					id={file.id}
					title={file.title}
					excerpt={file.excerpt}
				/>
			))}
		</div>
	);
}
