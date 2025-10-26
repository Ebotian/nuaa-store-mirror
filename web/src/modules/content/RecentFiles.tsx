export default function RecentFiles() {
	// show the first page / default category (all)
	return (
		<section>
			<h2 className="mb-4 text-lg font-semibold text-foreground-primary">
				仅供学习使用，相关教程书籍著作权属于相关作者，试卷著作权属于学校，请勿用于商业行为
				相关文章中内容均为原作者观点，与搬运者无关
			</h2>

			<h4 className="mb-4 text-lg font-semibold text-foreground-primary">
				一些话语
			</h4>

			<ul className="list-disc space-y-2 pl-6 text-sm text-foreground-muted">
				<li>不要作弊</li>
				<li>减少挂科</li>
				<li>爱惜生活</li>
			</ul>
		</section>
	);
}
