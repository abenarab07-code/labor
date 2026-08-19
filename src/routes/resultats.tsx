import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/resultats")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "hematologie" });
  },
});
