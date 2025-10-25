import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function ErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		return (
			<section className="flex h-full flex-col items-center justify-center gap-3 text-center">
				<h1 className="text-2xl font-semibold tracking-tight">出现错误</h1>
				<p className="text-sm text-foreground-subtle">
					{error.status} {error.statusText}
				</p>
			</section>
		);
	}

	return (
		<section className="flex h-full flex-col items-center justify-center gap-3 text-center">
			<h1 className="text-2xl font-semibold tracking-tight">遇到未知错误</h1>
			<p className="text-sm text-foreground-subtle">
				请稍后重试或联系站点维护者。
			</p>
		</section>
	);
}
