import type { KeyboardEvent, MouseEvent } from "react";
import { memo } from "react";

import type { FileItem } from "@services/adapters";

import { useCardMotion } from "./useCardMotion";

export type FileCardProps = {
	file: FileItem;
	onOpen?: (file: FileItem) => void;
	onPreview?: (file: FileItem) => void;
	onDownload?: (file: FileItem) => void;
};

export const FileCard = memo(function FileCard({
	file,
	onOpen,
	onPreview,
	onDownload,
}: FileCardProps) {
	const {
		id,
		name,
		title,
		extension,
		mime,
		sizeBytes,
		modifiedAt,
		supportsPreview,
		previewKind,
		previewUrl,
		downloadUrl,
	} = file;

	const handleClick = (e: MouseEvent) => {
		e.preventDefault();
		onOpen?.(file);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onOpen?.(file);
		}
	};

	const handlePreview = (e: MouseEvent) => {
		e.stopPropagation();
		onPreview?.(file);
	};

	const handleDownload = (e: MouseEvent) => {
		e.stopPropagation();
		onDownload?.(file);
	};

	const { motionProps } = useCardMotion();
	const extensionLabel = formatExtension(extension ?? name ?? title ?? id);
	const sizeLabel = formatFileSize(sizeBytes);
	const updatedLabel = formatUpdatedAt(modifiedAt);
	const displayName = name ?? title ?? "未命名文件";
	const previewBadge = supportsPreview
		? previewKind === "image"
			? "图像预览"
			: "文本预览"
		: "自动下载";
	const mimeLabel =
		mime ?? (extension ? `${extension.toUpperCase()} 文件` : null);
	const hasPreviewAction = supportsPreview && Boolean(previewUrl);
	const hasDownloadAction = Boolean(downloadUrl);

	return (
		<article
			role="button"
			aria-labelledby={`file-${id}-title`}
			tabIndex={0}
			className="group relative flex min-h-[5.5rem] w-full flex-row items-stretch overflow-hidden border border-surface-divider/55 bg-surface-base/8 px-5 py-4 text-left shadow-card transition duration-[var(--motion-medium)] hover:border-accent-focus/50 hover:bg-accent-focus/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			{...motionProps}
		>
			<div
				className="pointer-events-none absolute inset-0 layout-grid-overlay opacity-10"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute inset-0 card-noise"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-[6px] card-top-strip"
				aria-hidden
			/>
			<div className="relative z-10 flex w-full items-stretch gap-5">
				<div className="relative flex w-28 flex-shrink-0 flex-col justify-between border border-surface-divider/50 bg-surface-base/20 px-3 py-3 text-[0.75rem] font-mono leading-tight text-foreground-primary">
					<span className="tracking-[0.35em] text-foreground-muted">
						{extensionLabel}
					</span>
					<span>{sizeLabel}</span>
					<span>{updatedLabel}</span>
					<div
						className="pointer-events-none absolute inset-0 card-noise"
						aria-hidden
					/>
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
					<h3
						id={`file-${id}-title`}
						className="truncate text-base font-semibold text-foreground-primary"
					>
						{displayName}
					</h3>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs uppercase tracking-[0.28em] text-foreground-muted">
						<span>{previewBadge}</span>
						{mimeLabel ? (
							<span className="tracking-[0.18em]">{mimeLabel}</span>
						) : null}
					</div>
					<div className="mt-auto flex items-center justify-end gap-2 opacity-0 transition-opacity duration-[var(--motion-medium)] group-hover:opacity-100 group-focus-within:opacity-100">
						<button
							type="button"
							onClick={handlePreview}
							disabled={!hasPreviewAction}
							className="border border-accent-glow/40 bg-accent-glow/15 px-2 py-1 text-[0.65rem] tracking-[0.25em] text-foreground-primary transition-colors hover:bg-accent-glow/25 disabled:cursor-not-allowed disabled:opacity-40"
						>
							预览
						</button>
						<button
							type="button"
							onClick={handleDownload}
							disabled={!hasDownloadAction}
							className="border border-accent-focus/40 bg-accent-focus/15 px-2 py-1 text-[0.65rem] tracking-[0.25em] text-foreground-primary transition-colors hover:bg-accent-focus/25 disabled:cursor-not-allowed disabled:opacity-40"
						>
							下载
						</button>
					</div>
				</div>
			</div>
		</article>
	);
});

const formatExtension = (value?: string | null) => {
	if (!value) return "FILE";
	const segment = value.includes(".") ? value.split(".").pop() : value;
	const sanitized = segment?.replace(/[^A-Za-z0-9]/g, "");
	return sanitized ? sanitized.slice(0, 6).toUpperCase() : "FILE";
};

const formatFileSize = (sizeBytes?: number | null) => {
	if (!sizeBytes || Number.isNaN(sizeBytes)) return "--";
	const units = ["B", "KB", "MB", "GB", "TB"];
	let size = sizeBytes;
	let unitIndex = 0;
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex += 1;
	}
	return `${size.toFixed(unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
};

const formatUpdatedAt = (value?: string | null) => {
	if (!value) return "----";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "----";
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	const day = `${date.getDate()}`.padStart(2, "0");
	return `${year}-${month}-${day}`;
};
