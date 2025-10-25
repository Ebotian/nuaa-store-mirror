import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { useFileDetail } from "@/hooks/useFileDetail";

const formatFileSize = (sizeBytes?: number | null) => {
	if (!sizeBytes || Number.isNaN(sizeBytes)) return "未知体量";
	const units = ["B", "KB", "MB", "GB", "TB"];
	let size = sizeBytes;
	let index = 0;
	while (size >= 1024 && index < units.length - 1) {
		size /= 1024;
		index += 1;
	}
	const precision = index === 0 ? 0 : size >= 100 ? 0 : size >= 10 ? 1 : 2;
	return `${size.toFixed(precision)} ${units[index]}`;
};

const formatDateTime = (iso?: string | null) => {
	if (!iso) return "未知时间";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "未知时间";
	return new Intl.DateTimeFormat("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(date);
};

const derivePreviewKind = (
	previewKind?: "image" | "text",
	mime?: string | null,
	extension?: string | null
) => {
	if (previewKind) return previewKind;
	if (!mime && !extension) return null;
	if (mime?.startsWith("image/")) return "image" as const;
	if (mime?.startsWith("text/")) return "text" as const;
	if (mime === "application/json") return "text" as const;
	const lowered = extension?.toLowerCase();
	if (!lowered) return null;
	if (["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"].includes(lowered)) {
		return "image" as const;
	}
	if (
		[
			"txt",
			"md",
			"markdown",
			"json",
			"csv",
			"tsv",
			"xml",
			"yml",
			"yaml",
			"ini",
			"log",
			"cfg",
			"conf",
			"html",
			"htm",
			"css",
			"scss",
			"less",
			"js",
			"jsx",
			"ts",
			"tsx",
			"py",
			"c",
			"cpp",
			"java",
			"go",
			"rs",
			"sh",
			"bat",
			"ps1",
		].includes(lowered)
	) {
		return "text" as const;
	}
	return null;
};

const getDownloadName = (opts: {
	name?: string | null;
	title?: string | null;
	id: string;
}) => opts.name ?? opts.title ?? opts.id;

export function FileDetailPlaceholder() {
	const { fileId: encoded } = useParams<{ fileId: string }>();
	const fileId = encoded ? decodeURIComponent(encoded) : undefined;
	const navigate = useNavigate();

	const {
		data: file,
		isLoading,
		isError,
		error,
		refetch,
	} = useFileDetail(fileId);

	const previewKind = useMemo(
		() => derivePreviewKind(file?.previewKind, file?.mime, file?.extension),
		[file]
	);
	const previewUrl = useMemo(() => {
		if (!file || !file.supportsPreview) return null;
		return file.previewUrl ?? file.downloadUrl ?? null;
	}, [file]);
	const supportsPreview = !!file && !!previewUrl && !!previewKind;

	const triggerDownload = useCallback(() => {
		if (typeof window === "undefined") return;
		if (!file?.downloadUrl) return;
		const anchor = document.createElement("a");
		anchor.href = file.downloadUrl;
		anchor.download = getDownloadName({
			name: file.name,
			title: file.title,
			id: file.id,
		});
		anchor.rel = "noopener";
		anchor.target = "_blank";
		anchor.style.display = "none";
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	}, [file]);

	const textPreviewQuery = useQuery({
		queryKey: ["file-preview-content", file?.id, previewUrl],
		queryFn: async () => {
			if (!previewUrl) throw new Error("缺少预览链接");
			const response = await fetch(previewUrl);
			if (!response.ok) {
				throw new Error("加载预览内容失败");
			}
			return response.text();
		},
		enabled: supportsPreview && previewKind === "text" && !!previewUrl,
		staleTime: 0,
		refetchOnWindowFocus: false,
	});

	if (isLoading) {
		return (
			<section className="flex h-full flex-col gap-4 p-6">
				<div className="h-6 w-48 animate-pulse bg-surface-divider/60" />
				<div className="flex flex-1 flex-col gap-3">
					<div className="h-12 animate-pulse bg-surface-divider/40" />
					<div className="h-full animate-pulse bg-surface-divider/20" />
				</div>
			</section>
		);
	}

	if (isError) {
		return (
			<section className="relative flex h-full flex-col items-center justify-center gap-4 border border-status-danger/50 bg-status-danger/10 p-6 text-center shadow-card">
				<h1 className="text-xl font-semibold text-status-danger">
					加载文件失败
				</h1>
				<p className="text-sm text-foreground-primary">
					{error instanceof Error
						? error.message
						: "服务器没有返回有效的文件信息"}
				</p>
				<div className="flex flex-wrap justify-center gap-3">
					<button
						type="button"
						onClick={() => refetch()}
						className="border border-status-danger/60 bg-status-danger/15 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-primary transition hover:bg-status-danger/25"
					>
						重试
					</button>
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="border border-surface-divider/60 bg-surface-base/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-muted transition hover:text-foreground-primary"
					>
						返回
					</button>
				</div>
			</section>
		);
	}

	if (!file) {
		return null;
	}

	return (
		<section className="relative flex h-full flex-col overflow-hidden border border-surface-divider/60 bg-surface-elevated/70 shadow-card backdrop-blur">
			<header className="flex flex-wrap items-start justify-between gap-4 border-b border-surface-divider/50 bg-surface-base/15 px-6 py-5">
				<div className="space-y-2">
					<h1 className="text-xl font-semibold text-foreground-primary">
						{file.name ?? file.title ?? file.id}
					</h1>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] uppercase tracking-[0.3em] text-foreground-muted">
						<span>{formatFileSize(file.sizeBytes)}</span>
						<span>{formatDateTime(file.modifiedAt)}</span>
						{file.mime ? <span>{file.mime}</span> : null}
						{file.path ? (
							<span className="font-mono text-[0.65rem] tracking-[0.2em] text-foreground-muted/70">
								{file.path}
							</span>
						) : null}
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="border border-surface-divider/60 bg-surface-base/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-muted transition hover:text-foreground-primary"
					>
						返回
					</button>
					<button
						type="button"
						onClick={triggerDownload}
						disabled={!file.downloadUrl}
						className="border border-accent-focus/40 bg-accent-focus/15 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-primary transition hover:bg-accent-focus/25 disabled:cursor-not-allowed disabled:opacity-40"
					>
						下载
					</button>
				</div>
			</header>
			<div className="relative flex-1 overflow-auto bg-surface-base/10">
				{supportsPreview ? (
					previewKind === "image" ? (
						<div className="flex h-full items-center justify-center p-6">
							<img
								src={previewUrl ?? undefined}
								alt={file.name ?? file.title ?? file.id}
								className="max-h-[80vh] max-w-full rounded border border-surface-divider/40 bg-surface-base/20 object-contain shadow-inner"
							/>
						</div>
					) : (
						<div className="min-h-full bg-surface-base/5">
							{previewKind === "text" && textPreviewQuery.isLoading ? (
								<div className="flex h-full items-center justify-center p-6 text-sm text-foreground-muted">
									正在加载文本预览…
								</div>
							) : textPreviewQuery.isError ? (
								<div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-foreground-muted">
									<p>无法加载文本预览内容。</p>
									<button
										type="button"
										onClick={() => textPreviewQuery.refetch()}
										className="border border-accent-focus/40 bg-accent-focus/15 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-primary transition hover:bg-accent-focus/25"
									>
										重试加载
									</button>
								</div>
							) : (
								<pre className="whitespace-pre-wrap break-words px-6 py-6 font-mono text-[0.85rem] leading-relaxed text-foreground-primary/90">
									{textPreviewQuery.data ?? ""}
								</pre>
							)}
						</div>
					)
				) : (
					<div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
						<p className="text-sm text-foreground-muted">
							该文件类型暂不支持在线预览，已为您保留下载选项。
						</p>
						<button
							type="button"
							onClick={triggerDownload}
							disabled={!file.downloadUrl}
							className="border border-accent-focus/40 bg-accent-focus/15 px-4 py-2 text-xs uppercase tracking-[0.35em] text-foreground-primary transition hover:bg-accent-focus/25 disabled:cursor-not-allowed disabled:opacity-40"
						>
							立即下载
						</button>
					</div>
				)}
			</div>
		</section>
	);
}

export default FileDetailPlaceholder;
