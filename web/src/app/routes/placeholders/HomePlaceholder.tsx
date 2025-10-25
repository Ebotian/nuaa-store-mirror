import { memo } from "react";

export const HomePlaceholder = memo(function HomePlaceholder() {
	return (
		<section className="flex h-full flex-col items-center justify-center gap-4 text-center">
			<h1 className="text-3xl font-semibold tracking-tight">
				NUAA Store Mirror
			</h1>
			<p className="max-w-xl text-base text-foreground-subtle">
				欢迎来到新版界面。后续将在此展示精选内容、快速入口与动态通知。
			</p>
		</section>
	);
});
