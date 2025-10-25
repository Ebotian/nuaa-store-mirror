import { createBrowserRouter, type RouteObject } from "react-router-dom";

import { CategoriesPlaceholder } from "./placeholders/CategoriesPlaceholder";
import { FileDetailPlaceholder } from "./placeholders/FileDetailPlaceholder";
import { HomePlaceholder } from "./placeholders/HomePlaceholder";
import { SearchPlaceholder } from "./placeholders/SearchPlaceholder";
import { ErrorBoundary } from "./ErrorBoundary";
import { RootRoute } from "./RootRoute";

const routes: RouteObject[] = [
	{
		path: "/",
		element: <RootRoute />,
		errorElement: <ErrorBoundary />,
		children: [
			{ index: true, element: <HomePlaceholder /> },
			{ path: "categories", element: <CategoriesPlaceholder /> },
			{ path: "search", element: <SearchPlaceholder /> },
			{ path: "files/:fileId", element: <FileDetailPlaceholder /> },
		],
	},
];

export const appRouter = createBrowserRouter(routes);
