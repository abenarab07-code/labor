import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/temoignages")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "docteur" });
  },
});
