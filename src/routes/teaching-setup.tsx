import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/teaching-setup")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", search: { panel: "teaching" }, replace: true });
  },
});
