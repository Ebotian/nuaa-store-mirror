import type { PropsWithChildren } from "react";
import { memo } from "react";
import { Outlet } from "react-router-dom";

import { LayoutShell } from "@modules/layout";

export const AppShell = memo(function AppShell({
	children,
}: PropsWithChildren) {
	return <LayoutShell>{children ?? <Outlet />}</LayoutShell>;
});
