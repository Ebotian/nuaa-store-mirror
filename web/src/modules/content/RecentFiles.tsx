import FileList from "./FileList";

export default function RecentFiles() {
	// show the first page / default category (all)
	return (
		<section>
			<h2 className="mb-4 text-lg font-semibold text-foreground-primary">
				最新文件
			</h2>
			<FileList />
		</section>
	);
}
