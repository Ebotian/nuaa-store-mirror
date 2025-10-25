import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { AppProviders } from "@app/providers/AppProviders";
import "@styles/reset.css";
import "@styles/tailwind.css";
import "@styles/globals.css";
import "@styles/markdown.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AppProviders>
			<App />
		</AppProviders>
	</StrictMode>
);
