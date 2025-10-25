import { memo } from "react";
import { NavLink } from "react-router-dom";

const navItems = [
	{ to: "/", label: "首页", description: "推荐与快捷入口", exact: true },
	{ to: "/categories", label: "分类", description: "浏览分类树" },
	{ to: "/files", label: "文件", description: "查看文件列表" },
	{ to: "/search", label: "搜索", description: "全局检索" },
];

const navLinkBase =
	"group flex flex-col gap-1 border border-transparent px-5 py-4 text-left transition-colors duration-200 hover:border-accent-glow/60 hover:bg-accent-glow/5";

export const NavigationRail = memo(function NavigationRail() {
	return (
		<nav className="sticky top-28 hidden h-fit min-w-[220px] flex-col gap-3 lg:flex">
			{navItems.map((item) => (
				<NavLink
					key={item.to}
					to={item.to}
					className={({ isActive }) =>
						[
							navLinkBase,
							isActive
								? "border-accent-glow/80 bg-accent-glow/10 text-foreground-inverted shadow-glow"
								: "border-surface-divider bg-surface-elevated/30 text-foreground-subtle",
						].join(" ")
					}
					end={item.exact}
				>
					<span className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground-muted group-hover:text-foreground-primary">
						{item.label}
					</span>
					<span className="text-xs text-foreground-subtle group-hover:text-foreground-primary">
						{item.description}
					</span>
				</NavLink>
			))}
		</nav>
	);
});
