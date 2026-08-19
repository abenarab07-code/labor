import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/clinique")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "docteur" });
  },
});
