import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@app/shell/ThemeToggle";
import { useSearch } from "@app/providers/SearchProvider";

function fireNavigationOpenEvent() {
	if (typeof document === "undefined") return;
	document.dispatchEvent(new CustomEvent("layout:navigation-open"));
}

export function TopBar() {
	const [scrolled, setScrolled] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();
	const search = useSearch();

	useEffect(() => {
		if (typeof window === "undefined") return undefined;
		const handleScroll = () => {
			setScrolled(window.scrollY > 32);
		};
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navLabel = useMemo(
		() => (scrolled ? "指挥面板" : "导航指令"),
		[scrolled]
	);

	const handleNavOpen = useCallback(() => fireNavigationOpenEvent(), []);

	const handleHomeClick = useCallback(() => {
		if (search.isActive) {
			search.clearSearch();
		}
		navigate("/");
	}, [navigate, search]);

	const handleSearchSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			search.commitSearch();
			if (location.pathname !== "/search") {
				navigate("/search");
			}
		},
		[location.pathname, navigate, search]
	);

	const handleSearchChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			search.setInputValue(event.target.value);
		},
		[search]
	);

	const handleSearchClear = useCallback(() => {
		if (!search.inputValue) return;
		search.clearSearch();
	}, [search]);

	useEffect(() => {
		if (!search.isActive && location.pathname === "/search") {
			navigate("/", { replace: true });
		}
	}, [location.pathname, navigate, search.isActive]);

	const showClearButton = search.inputValue.length > 0;
	const searchPlaceholder = search.isSearching
		? "正在检索…"
		: "搜索文件、课程、资源...";

	const renderSearchField = (isMobile: boolean) => (
		<label
			className={`flex items-center gap-2 border border-surface-divider bg-surface-base/20 px-3 py-2 text-sm text-foreground-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-[var(--motion-medium)] ${
				isMobile ? "w-full" : ""
			}`}
		>
			<svg className="h-4 w-4 text-accent-glow" viewBox="0 0 24 24" aria-hidden>
				<circle
					cx="10.5"
					cy="10.5"
					r="6.5"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.9"
				/>
				<line
					x1="15.8"
					y1="15.8"
					x2="20.4"
					y2="20.4"
					stroke="currentColor"
					strokeWidth="1.9"
					strokeLinecap="round"
				/>
			</svg>
			<input
				type="search"
				className={`bg-transparent text-sm text-foreground-primary placeholder:text-foreground-muted focus:outline-none ${
					isMobile ? "w-full" : "w-64"
				}`}
				placeholder={searchPlaceholder}
				aria-label="搜索文件、课程、资源"
				value={search.inputValue}
				onChange={handleSearchChange}
				autoComplete="off"
			/>
			<button
				type="button"
				onClick={handleSearchClear}
				className={`transition-opacity duration-[var(--motion-medium)] ${
					showClearButton ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
				aria-label="清除搜索"
			>
				<svg
					viewBox="0 0 24 24"
					className="h-3.5 w-3.5 text-foreground-muted"
					aria-hidden
				>
					<path
						d="M18 6L6 18m0-12l12 12"
						stroke="currentColor"
						strokeWidth="1.7"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</button>
		</label>
	);

	return (
		<header
			className={`group/topbar sticky top-0 z-40 overflow-hidden border-b border-surface-divider/60 transition-all duration-[var(--motion-medium)] ${
				scrolled
					? "bg-surface-elevated/85 py-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
					: "bg-surface-elevated/70 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-xl"
			}`}
		>
			<div className="pointer-events-none absolute inset-0" aria-hidden>
				<span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent-focus/60 to-transparent" />
				<span className="absolute inset-x-6 bottom-0 h-[1px] bg-linear-scan" />
				<span className="absolute inset-0 opacity-10 mix-blend-screen layout-grid-overlay" />
				<span className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-accent-glow/18 via-transparent to-transparent" />
			</div>
			<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 md:gap-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={handleHomeClick}
							className="relative flex h-12 w-12 items-center justify-center border border-accent-focus/30 bg-accent-glow/15 text-[0.55rem] font-semibold uppercase tracking-[0.4em] text-foreground-muted transition-colors duration-[var(--motion-medium)] hover:border-accent-focus/50 hover:bg-accent-glow/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus"
							aria-label="返回主页"
						>
							<span
								className="absolute inset-0 border border-surface-divider/40"
								aria-hidden
							/>
							<span className="relative font-mono text-[0.65rem] text-accent-focus">
								NUAA-0321
							</span>
						</button>
						<div className="flex flex-col">
							<span className="text-xs font-semibold uppercase tracking-[0.42em] text-foreground-subtle">
								nuaa store mirror
							</span>
							<span className="text-xl font-bold tracking-tight text-foreground-primary">
								Ur little helper here
							</span>
						</div>
					</div>
					<div className="flex items-center gap-3 md:gap-4">
						<button
							type="button"
							onClick={handleNavOpen}
							className="flex items-center gap-2 border border-accent-focus/30 bg-accent-focus/10 px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.35em] text-foreground-primary transition-colors duration-[var(--motion-medium)] hover:border-accent-focus/55 hover:bg-accent-focus/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-focus md:hidden"
							aria-controls="primary-navigation"
						>
							<span className="relative flex h-5 w-5 items-center justify-center border border-accent-focus/40 bg-transparent">
								<span
									className="h-[1px] w-3 bg-foreground-primary"
									aria-hidden
								/>
								<span
									className="absolute h-[1px] w-3 -translate-y-1.5 bg-foreground-primary"
									aria-hidden
								/>
								<span
									className="absolute h-[1px] w-3 translate-y-1.5 bg-foreground-primary"
									aria-hidden
								/>
							</span>
							<span>{navLabel}</span>
						</button>
						<form
							role="search"
							aria-label="全局搜索"
							onSubmit={handleSearchSubmit}
							className="hidden md:block"
						>
							{renderSearchField(false)}
						</form>
						<ThemeToggle />
					</div>
				</div>
				<form
					role="search"
					aria-label="全局搜索"
					onSubmit={handleSearchSubmit}
					className="w-full md:hidden"
				>
					{renderSearchField(true)}
				</form>
			</div>
		</header>
	);
}
