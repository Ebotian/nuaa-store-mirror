import FileList from "@/modules/content/FileList";

export default function FilesPlaceholder() {
	return (
		<main className="p-4">
			<h2 className="mb-4 text-lg font-semibold text-foreground-primary">
				文件列表（占位）
			</h2>
			<FileList />
		</main>
	);
}
