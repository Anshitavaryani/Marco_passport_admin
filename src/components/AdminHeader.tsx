/** @format */

import { useState } from "react";
import { Link } from "react-router";
import { User, LogOut, Key, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAdminProfile } from "@/hooks/use-admin-profile";
import { clearSession } from "@/lib/session";
import { getInitials } from "@/lib/utils";

export function AdminHeader() {
  const { profile } = useAdminProfile();
  const adminName = profile?.name || "Admin User";
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = getInitials(adminName);

  return (
    <header className="h-16 sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors" />
      </div>

      <DropdownMenu onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full transition-colors hover:bg-muted/60 outline-hidden">
            <div className="w-8 h-8 rounded-full bg-gold-soft ring-1 ring-gold-light flex items-center justify-center text-gold-dark text-xs font-semibold">
              {initials || <User className="h-4 w-4" />}
            </div>
            <span className="text-sm font-medium text-foreground">
              {adminName}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 border shadow-lg">
          {/* Router links, not window.location: a full reload would rebuild
              the layout and reset the sidebar. */}
          <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
            <Link to="/admin/profile">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
            <Link to="/change-password">
              <Key className="h-4 w-4" />
              Change Password
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            onClick={() => {
              clearSession();
              window.location.href = "/";
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}