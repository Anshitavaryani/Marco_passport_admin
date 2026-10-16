/** @format */
import { useNavigate } from "react-router";
import {
  MapPin,
  Building2,
  Newspaper,
  Users,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useAdminProfile } from "@/hooks/use-admin-profile";
import { canAccess } from "@/lib/adminRoles";

const quickLinks = [
  {
    label: "Places",
    description: "Beaches, parks & attractions",
    icon: MapPin,
    to: "/places",
  },
  {
    label: "Businesses",
    description: "Hotels, restaurants & services",
    icon: Building2,
    to: "/businesses",
  },
  {
    label: "Blog",
    description: "Articles & local guides",
    icon: Newspaper,
    to: "/blogs",
  },
  {
    label: "Users",
    description: "Registered app users",
    icon: Users,
    to: "/users",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, abbreviation } = useAdminProfile();
  const adminName = profile?.name;
  // Every quick link is an admin-tier screen.
  const showQuickLinks = canAccess(abbreviation, "admin");

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-px w-5 bg-gold-muted opacity-70" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-gold-dark">
            Overview
          </span>
        </div>
        <h1 className="text-[22px] font-semibold text-navy">
          Welcome{adminName ? `, ${adminName}` : " back"}
          <span className="italic font-display text-gold">
            .
          </span>
        </h1>
        <p className="text-sm mt-1.5 text-ink-muted">
          Manage the places, businesses, and stories that make up the Marco Passport.
        </p>
      </div>

      {/* Quick access grid */}
      {showQuickLinks && (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => navigate(link.to)}
            className="rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5 bg-white border border-line shadow-card"
          >
            <div className="flex items-start justify-between">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center bg-gold-soft"
              >
                <link.icon className="h-[18px] w-[18px] text-gold-dark" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-ink-ghost" />
            </div>
            <p className="text-[15px] font-semibold mt-3 text-navy">
              {link.label}
            </p>
            <p className="text-xs mt-0.5 text-ink-faint">
              {link.description}
            </p>
          </button>
        ))}
      </div>
      )}

      {/* Insights placeholder */}
      <div
        className="rounded-2xl p-12 flex flex-col items-center text-center gap-3 bg-white border border-line shadow-card"
      >
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center bg-gold-soft ring-1 ring-gold-light/33"
        >
          <Sparkles className="h-5 w-5 text-gold-dark" />
        </div>
        <h2 className="text-lg font-semibold text-navy">
          Insights are on the way
        </h2>
        <p className="text-sm max-w-sm text-ink-muted">
          Charts and summaries for listings, top-rated places, and traffic across the Marco
          Passport will live here soon.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;