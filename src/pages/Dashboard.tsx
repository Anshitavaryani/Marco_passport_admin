/** @format */
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Building2,
  Newspaper,
  Users,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  boxShadow: "0 1px 3px rgba(16,29,48,0.06)",
};

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
  const adminName = localStorage.getItem("admin_name");

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital@1&display=swap');`}</style>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-px w-5" style={{ background: "#D2B876", opacity: 0.7 }} />
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "#a3874f" }}>
            Overview
          </span>
        </div>
        <h1 className="text-[22px] font-semibold" style={{ color: "#101d30" }}>
          Welcome{adminName ? `, ${adminName}` : " back"}
          <span className="italic" style={{ fontFamily: "'Fraunces', serif", color: "#c9a227" }}>
            .
          </span>
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "#6b7688" }}>
          Manage the places, businesses, and stories that make up the Marco Passport.
        </p>
      </div>

      {/* Quick access grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => navigate(link.to)}
            className="rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5"
            style={cardStyle}
          >
            <div className="flex items-start justify-between">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: "#fbf3de" }}
              >
                <link.icon className="h-[18px] w-[18px]" style={{ color: "#a3874f" }} />
              </div>
              <ArrowUpRight className="h-4 w-4" style={{ color: "#c2c7d1" }} />
            </div>
            <p className="text-[15px] font-semibold mt-3" style={{ color: "#101d30" }}>
              {link.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9aa3b2" }}>
              {link.description}
            </p>
          </button>
        ))}
      </div>

      {/* Insights placeholder */}
      <div
        className="rounded-2xl p-12 flex flex-col items-center text-center gap-3"
        style={cardStyle}
      >
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center"
          style={{ background: "#fbf3de", boxShadow: "0 0 0 1px #e4ce8f55" }}
        >
          <Sparkles className="h-5 w-5" style={{ color: "#a3874f" }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: "#101d30" }}>
          Insights are on the way
        </h2>
        <p className="text-sm max-w-sm" style={{ color: "#6b7688" }}>
          Charts and summaries for listings, top-rated places, and traffic across the Marco
          Passport will live here soon.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;