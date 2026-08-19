import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/approche")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "parcours" });
  },
});
