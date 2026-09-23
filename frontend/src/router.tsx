import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { Rettssal } from "./features/rettssak/routes/Rettssal";

const rootRoute = createRootRoute({ component: Outlet });

const rettssalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Rettssal,
});

export const router = createRouter({ routeTree: rootRoute.addChildren([rettssalRoute]) });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
