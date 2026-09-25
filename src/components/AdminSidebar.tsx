/** @format */

import { NavLink } from "react-router-dom";
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
import "./AdminSidebar.module.scss";
import logoFull from "@/assets/logo.webp";

const navigationGroups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
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
      { title: "Admins", url: "/admins", icon: UserCog },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="AdminSidebar">
      <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
        <SidebarContent>
          <div className="flex items-center justify-center py-6 px-4">
            {isCollapsed ? (
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(180deg, #E4CE8F 0%, #D2B876 100%)",
                }}
              >
                <span
                  className="italic"
                  style={{ fontFamily: "'Fraunces', serif", color: "#101d30", fontSize: 17, fontWeight: 600 }}
                >
                  M
                </span>
              </div>
            ) : (
              <div
                className="flex items-center justify-center rounded-2xl px-4 py-2.5 w-full"
                style={{
                  background: "linear-gradient(180deg, #FAF6EC 0%, #EFE4C8 100%)",
                  boxShadow: "0 0 0 1px rgba(228,206,143,0.35)",
                }}
              >
                <img
                  src={logoFull}
                  alt="Marco Passport"
                  style={{ height: 34, width: "auto", objectFit: "contain" }}
                />
              </div>
            )}
          </div>

          {navigationGroups.map((group, i) => (
            <SidebarGroup key={group.label} className={`px-3 ${i === 0 ? "pt-0" : "pt-3"} pb-1`}>
              <SidebarGroupLabel
                className={
                  isCollapsed
                    ? "hidden"
                    : "px-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
                }
                style={isCollapsed ? undefined : { color: "#5c6b81" }}
              >
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5 mt-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={isCollapsed ? item.title : undefined}>
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] sidebar-link ${
                              isActive ? "font-medium is-active" : "font-normal"
                            }`
                          }
                        >
                          <item.icon className="h-[17px] w-[17px] flex-shrink-0" />
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
    </div>
  );
}