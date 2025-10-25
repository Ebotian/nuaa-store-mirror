import { Outlet } from "react-router-dom";

import { AppShell } from "@app/shell/AppShell";

export function RootRoute() {
	return (
		<AppShell>
			<Outlet />
		</AppShell>
	);
}
