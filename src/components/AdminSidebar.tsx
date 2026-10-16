/** @format */

import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Newspaper,
  Tag,
  MapPin,
  Building2,
  Tags,
  ClipboardList,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logoFull from "@/assets/logo.webp";
import { useAdminProfile } from "@/hooks/use-admin-profile";
import { AccessTier, canAccess } from "@/lib/adminRoles";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  access?: AccessTier; // defaults to "admin", like AdminLayout
};

const navigationGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, access: "any" }],
  },
  {
    label: "Content",
    items: [
      { title: "Blog", url: "/blogs", icon: Newspaper },
      { title: "Blog Categories", url: "/blog-categories", icon: Tag },
    ],
  },
 {
    label: "Business Directory",
    items: [
      { title: "Businesses", url: "/businesses", icon: Building2 },
      { title: "Business Categories", url: "/business-categories", icon: Tags },
      { title: "Business Requests", url: "/business-requests", icon: ClipboardList },
    ],
  },
  {
    label: "Places to Visit",
    items: [
      { title: "Places", url: "/places", icon: MapPin },
      { title: "Place Categories", url: "/place-categories", icon: Tags },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Users", url: "/users", icon: Users },
      { title: "Admins", url: "/admins", icon: UserCog, access: "superAdmin" },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { abbreviation } = useAdminProfile();

  // Hide what this admin's role can't use; the API would refuse it anyway.
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(abbreviation, item.access ?? "admin")),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar className="border-sidebar-border" collapsible="icon">
      <SidebarContent className="bg-linear-to-b from-navy to-navy-deep">
        <div className="flex items-center justify-center py-6 px-4">
          {isCollapsed ? (
            <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-linear-to-b from-gold-light to-gold-muted">
              <span className="font-display text-[17px] font-semibold italic text-navy">M</span>
            </div>
          ) : (
            <div className="flex w-full items-center justify-center rounded-2xl px-4 py-2.5 bg-linear-to-b from-parchment to-parchment-deep ring-1 ring-gold-light/35">
              <img src={logoFull} alt="Marco Passport" className="h-[34px] w-auto object-contain" />
            </div>
          )}
        </div>

        {visibleGroups.map((group, i) => (
          <SidebarGroup key={group.label} className={`px-3 ${i === 0 ? "pt-0" : "pt-3"} pb-1`}>
            <SidebarGroupLabel
              className={isCollapsed ? "hidden" : "px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-dusk"}
            >
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5 mt-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {/* NavLink marks the current page with aria-current="page" */}
                    <SidebarMenuButton
                      asChild
                      tooltip={isCollapsed ? item.title : undefined}
                      className="h-auto gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-[width,height,padding,color,background-color] aria-[current=page]:bg-gold-light aria-[current=page]:font-medium aria-[current=page]:text-navy aria-[current=page]:hover:bg-gold-muted aria-[current=page]:hover:text-navy"
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-[17px] w-[17px] shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
