import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/soins")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "analyses" });
  },
});
