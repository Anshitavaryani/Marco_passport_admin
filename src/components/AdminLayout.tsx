import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import ProtectedRoute from "./ProtectedRoute";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import { useAdminProfile } from "@/hooks/use-admin-profile";
import { AccessTier, canAccess } from "@/lib/adminRoles";

interface AdminLayoutProps {
  children: React.ReactNode;
  // Role tier the page needs (see lib/adminRoles). Content screens default to
  // "admin", which is what the backend requires for them.
  access?: AccessTier;
}

function AccessGate({ access, children }: { access: AccessTier; children: React.ReactNode }) {
  const { loading, abbreviation } = useAdminProfile();

  if (access === "any") return <>{children}</>;
  if (loading) {
    return (
      <div className="w-full py-16 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#9aa3b2" }} />
      </div>
    );
  }
  if (!canAccess(abbreviation, access)) return <UnauthorizedPage />;
  return <>{children}</>;
}

export function AdminLayout({ children, access = "admin" }: AdminLayoutProps) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-admin-bg">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <AdminHeader />
            <main className="flex-1 p-6">
              <AccessGate access={access}>{children}</AccessGate>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
