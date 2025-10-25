import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import type { FileItem } from "@services/adapters";

import { useAdapters } from "./adaptersContext";

const TEXT_EXTENSIONS = new Set([
	"txt",
	"log",
	"md",
	"markdown",
	"csv",
	"tsv",
	"json",
	"xml",
	"yml",
	"yaml",
	"ini",
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
	"java",
	"c",
	"cpp",
	"py",
	"go",
	"rs",
	"rb",
	"sh",
	"bat",
	"ps1",
]);

export type SearchMatch = {
	file: FileItem;
	score: number;
	snippet: string | null;
	tokens: string[];
	matchedIn: {
		title: boolean;
		extension: boolean;
		content: boolean;
	};
};

type SearchContextValue = {
	inputValue: string;
	setInputValue: (value: string) => void;
	commitSearch: () => void;
	clearSearch: () => void;
	query: string;
	isActive: boolean;
	isSearching: boolean;
	indexLoading: boolean;
	indexError: Error | null;
	baseResults: SearchMatch[];
	results: SearchMatch[];
	getResultsForCategory: (categoryId?: string | null) => SearchMatch[];
	matchedCategoryIds: Set<string>;
	activeCategoryFilter: string | null;
	setActiveCategoryFilter: (categoryId: string | null) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useSearch() {
	const ctx = useContext(SearchContext);
	if (!ctx) {
		throw new Error("useSearch must be used within SearchProvider");
	}
	return ctx;
}

type IndexedFile = {
	file: FileItem;
	title: string;
	titleOriginal: string;
	extension: string;
	path: string;
	digestOriginal: string | null;
	digestLower: string | null;
	isText: boolean;
};

function isTextFile(file: FileItem) {
	if (file.previewKind === "text") return true;
	if (file.mime && file.mime.startsWith("text/")) return true;
	if (file.mime === "application/json") return true;
	if (file.extension && TEXT_EXTENSIONS.has(file.extension.toLowerCase()))
		return true;
	return false;
}

function buildSnippet(
	digest: string,
	tokens: string[],
	fallbackLength = 120
): string {
	const lower = digest.toLowerCase();
	for (const token of tokens) {
		if (!token) continue;
		const idx = lower.indexOf(token);
		if (idx !== -1) {
			const start = Math.max(0, idx - 40);
			const end = Math.min(digest.length, idx + token.length + 60);
			const prefix = start > 0 ? "…" : "";
			const suffix = end < digest.length ? "…" : "";
			return `${prefix}${digest.slice(start, end)}${suffix}`;
		}
	}
	if (digest.length <= fallbackLength) return digest;
	return `${digest.slice(0, fallbackLength)}…`;
}

function expandCategoryTrail(categoryId: string | null | undefined) {
	if (!categoryId) return [] as string[];
	const segments = categoryId.split("/").filter(Boolean);
	const trail: string[] = [];
	segments.forEach((_, index) => {
		trail.push(segments.slice(0, index + 1).join("/"));
	});
	return trail;
}

function matchesCategory(
	categoryId: string | null | undefined,
	target?: string | null
) {
	if (!target) return true;
	if (!categoryId) return false;
	if (categoryId === target) return true;
	return categoryId.startsWith(`${target}/`);
}

export function SearchProvider({ children }: PropsWithChildren) {
	const adapters = useAdapters();
	const [inputValue, setInputValue] = useState("");
	const [pendingQuery, setPendingQuery] = useState("");
	const [activeQuery, setActiveQuery] = useState("");
	const [activeCategoryFilter, setActiveCategoryFilter] = useState<
		string | null
	>(null);
	const lastRunRef = useRef(0);
	const previousQueryRef = useRef("");

	const {
		data: allFiles = [],
		isLoading: indexLoading,
		error: indexErrorRaw,
	} = useQuery({
		queryKey: ["files", "all"],
		queryFn: () => adapters!.fetchFiles(""),
		enabled: !!adapters,
		staleTime: 5 * 60 * 1000,
	});

	const indexError = indexErrorRaw instanceof Error ? indexErrorRaw : null;

	useEffect(() => {
		const trimmed = inputValue.trim();
		if (!trimmed) {
			setPendingQuery("");
			return;
		}
		const timer = setTimeout(() => {
			setPendingQuery(trimmed);
		}, 2000);
		return () => clearTimeout(timer);
	}, [inputValue]);

	const commitSearch = useCallback(() => {
		setPendingQuery(inputValue.trim());
	}, [inputValue]);

	const clearSearch = useCallback(() => {
		setInputValue("");
		setPendingQuery("");
		setActiveQuery("");
		setActiveCategoryFilter(null);
		lastRunRef.current = 0;
	}, []);

	useEffect(() => {
		const target = pendingQuery.trim();
		if (target === activeQuery) return;

		let cancelled = false;
		const invoke = () => {
			if (cancelled) return;
			setActiveQuery(target);
			lastRunRef.current = Date.now();
		};

		if (!target) {
			invoke();
			return;
		}

		const elapsed = Date.now() - lastRunRef.current;
		const wait = Math.max(0, 500 - elapsed);
		const timer = setTimeout(invoke, wait);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [pendingQuery, activeQuery]);

	useEffect(() => {
		const previous = previousQueryRef.current;
		if (!activeQuery) {
			setActiveCategoryFilter((prev) => (prev ? null : prev));
		} else if (previous && activeQuery !== previous) {
			setActiveCategoryFilter(null);
		}
		previousQueryRef.current = activeQuery;
	}, [activeQuery]);

	const indexedFiles: IndexedFile[] = useMemo(() => {
		return allFiles.map((file) => {
			const titleOriginal = (file.title ?? file.name ?? file.id ?? "").trim();
			const title = titleOriginal.toLowerCase();
			const extension = (file.extension ?? "").toLowerCase();
			const path = (file.path ?? file.id ?? "").toLowerCase();
			const digestOriginal = file.digest ?? null;
			const digestLower = digestOriginal ? digestOriginal.toLowerCase() : null;
			return {
				file,
				title,
				titleOriginal,
				extension,
				path,
				digestOriginal,
				digestLower,
				isText: isTextFile(file),
			};
		});
	}, [allFiles]);

	const tokens = useMemo(() => {
		return activeQuery
			.split(/\s+/)
			.map((token) => token.toLowerCase())
			.filter(Boolean);
	}, [activeQuery]);

	const baseResults = useMemo(() => {
		if (!tokens.length) return [] as SearchMatch[];
		if (!indexedFiles.length) return [] as SearchMatch[];

		const results: SearchMatch[] = [];

		indexedFiles.forEach((entry) => {
			let titleMatches = 0;
			let extensionMatches = 0;
			let contentMatches = 0;
			let matchedAll = true;

			for (const token of tokens) {
				if (!token) continue;
				let matched = false;
				if (entry.title.includes(token)) {
					titleMatches += 1;
					matched = true;
				} else if (entry.path.includes(token)) {
					titleMatches += 0.5;
					matched = true;
				} else if (entry.extension && entry.extension.includes(token)) {
					extensionMatches += 1;
					matched = true;
				} else if (entry.isText && entry.digestLower?.includes(token)) {
					contentMatches += 1;
					matched = true;
				}

				if (!matched) {
					matchedAll = false;
					break;
				}
			}

			if (!matchedAll) return;

			let score = titleMatches * 4 + extensionMatches * 2 + contentMatches;
			if (tokens.length && entry.title.startsWith(tokens[0])) {
				score += 3;
			}
			if (entry.file.modifiedAt) {
				const ts = Date.parse(entry.file.modifiedAt);
				if (!Number.isNaN(ts)) {
					const age = Date.now() - ts;
					const thirtyDays = 1000 * 60 * 60 * 24 * 30;
					const oneYear = thirtyDays * 12;
					if (age <= thirtyDays) score += 2;
					else if (age <= oneYear) score += 1;
				}
			}

			const snippet =
				entry.isText && entry.digestOriginal
					? buildSnippet(entry.digestOriginal, tokens)
					: null;

			results.push({
				file: entry.file,
				score,
				snippet,
				tokens,
				matchedIn: {
					title: titleMatches > 0,
					extension: extensionMatches > 0,
					content: contentMatches > 0,
				},
			});
		});

		return results.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			const aTime = a.file.modifiedAt ? Date.parse(a.file.modifiedAt) : 0;
			const bTime = b.file.modifiedAt ? Date.parse(b.file.modifiedAt) : 0;
			return bTime - aTime;
		});
	}, [indexedFiles, tokens]);

	const matchedCategoryIds = useMemo(() => {
		const set = new Set<string>();
		baseResults.forEach(({ file }) => {
			expandCategoryTrail(file.categoryId).forEach((id) => set.add(id));
		});
		return set;
	}, [baseResults]);

	const results = useMemo(() => {
		if (!baseResults.length) return baseResults;
		if (!activeCategoryFilter) return baseResults;
		return baseResults.filter(({ file }) =>
			matchesCategory(file.categoryId, activeCategoryFilter)
		);
	}, [baseResults, activeCategoryFilter]);

	const getResultsForCategory = useCallback(
		(categoryId?: string | null) => {
			if (!baseResults.length) return [] as SearchMatch[];
			return baseResults.filter(({ file }) => {
				const byCategory = matchesCategory(file.categoryId, categoryId);
				const byFilter = matchesCategory(file.categoryId, activeCategoryFilter);
				return byCategory && byFilter;
			});
		},
		[baseResults, activeCategoryFilter]
	);

	const trimmedInput = inputValue.trim();
	const isActive = tokens.length > 0;
	const isSearching =
		indexLoading ||
		(trimmedInput.length > 0 && trimmedInput !== activeQuery) ||
		(pendingQuery.trim().length > 0 &&
			pendingQuery.trim() !== activeQuery.trim());

	const value: SearchContextValue = {
		inputValue,
		setInputValue,
		commitSearch,
		clearSearch,
		query: activeQuery,
		isActive,
		isSearching,
		indexLoading,
		indexError,
		baseResults,
		results,
		getResultsForCategory,
		matchedCategoryIds,
		activeCategoryFilter,
		setActiveCategoryFilter,
	};

	return (
		<SearchContext.Provider value={value}>{children}</SearchContext.Provider>
	);
}
