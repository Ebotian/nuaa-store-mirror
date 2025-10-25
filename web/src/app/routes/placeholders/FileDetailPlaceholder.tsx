import { memo } from "react";

export const FileDetailPlaceholder = memo(function FileDetailPlaceholder() {
	return (
		<section className="flex h-full flex-col items-center justify-center gap-3 text-center">
			<h1 className="text-2xl font-medium tracking-tight">文件详情即将上线</h1>
			<p className="max-w-lg text-sm text-foreground-subtle">
				我们将在此展示文件元数据、预览能力及相关资源链接。
			</p>
		</section>
	);
});
