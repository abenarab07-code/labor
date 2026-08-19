import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/lib/admin/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dr Tarfaya Lab OS — Administration" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const auth = useAdminAuth();

  if (auth.status === "loading") {
    return (
      <div className="min-h-screen bg-[#0b1618] flex items-center justify-center text-ivory">
        <Loader2 className="h-6 w-6 animate-spin text-teal" />
      </div>
    );
  }
  if (auth.status === "unauthenticated") return <AdminLogin onSignedIn={auth.refresh} />;
  if (auth.status === "unauthorized") return <AdminLogin unauthorized />;

  return (
    <AdminShell auth={auth}>
      <Outlet />
      <Toaster position="top-right" richColors />
    </AdminShell>
  );
}
