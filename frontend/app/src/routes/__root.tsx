/*
 * Root Route - The top-level layout that wraps every page in the app
 *
 * This route:
 * - Renders the <Outlet /> where child routes (login, dashboard, etc.) are mounted
 * - Adds the global <Toaster /> for toast notifications (sonner)
 * - In development, shows TanStack DevTools (Router + Query) in the bottom-right corner
 *
 * The router context includes the QueryClient so route loaders can prefetch data.
 * See: https://tanstack.com/router/latest/docs/framework/react/guide/router-context
 */

import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { Toaster } from "../components/ui/toaster";
import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: function RootComponent() {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  },
});
