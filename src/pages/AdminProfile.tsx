/** @format */
import { useEffect, useState } from "react";
import { User, Mail, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetAdminProfileAPI } from "@/services/Api/AuthApi";

interface Profile {
  name: string;
  email: string;
  admin_role?: { name: string };
}

const initials = (name?: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "—";

export default function AdminProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await GetAdminProfileAPI({ token });
      if (res.data?.success) {
        setProfile(res.data.data);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load profile",
        description: err.response?.data?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital@1&display=swap');`}</style>

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-px w-5" style={{ background: "#D2B876", opacity: 0.7 }} />
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "#a3874f" }}>
            Account
          </span>
        </div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold" style={{ color: "#101d30" }}>
          <User className="h-5 w-5" style={{ color: "#c9a227" }} />
          My profile
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
          Your admin account details.
        </p>
      </div>

      <div
        className="max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(22,35,58,0.96) 0%, rgba(16,29,48,0.96) 100%)",
          border: "1px solid rgba(228,206,143,0.16)",
          boxShadow: "0 16px 40px -16px rgba(0,0,0,0.4)",
        }}
      >
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#5c6b81" }} />
          </div>
        ) : !profile ? (
          <div className="py-16 text-center text-sm" style={{ color: "#5c6b81" }}>
            Couldn't load profile.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 px-6 py-6" style={{ borderBottom: "1px solid rgba(228,206,143,0.12)" }}>
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(180deg, #E4CE8F 0%, #D2B876 100%)",
                }}
              >
                <span
                  className="italic"
                  style={{ fontFamily: "'Fraunces', serif", color: "#101d30", fontSize: 20, fontWeight: 600 }}
                >
                  {initials(profile.name)}
                </span>
              </div>
              <div>
                <p className="text-[17px] font-semibold" style={{ color: "#F3EEE3" }}>
                  {profile.name}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: "rgba(228,206,143,0.14)", color: "#E4CE8F" }}
                >
                  <Shield className="h-3 w-3" />
                  {profile.admin_role?.name || "N/A"}
                </span>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#0c1626", border: "1px solid rgba(228,206,143,0.12)" }}
                >
                  <User className="h-4 w-4" style={{ color: "#93A1B5" }} />
                </div>
                <div>
                  <p className="text-[11px] tracking-wider uppercase" style={{ color: "#5c6b81" }}>
                    Name
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#F3EEE3" }}>
                    {profile.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#0c1626", border: "1px solid rgba(228,206,143,0.12)" }}
                >
                  <Mail className="h-4 w-4" style={{ color: "#93A1B5" }} />
                </div>
                <div>
                  <p className="text-[11px] tracking-wider uppercase" style={{ color: "#5c6b81" }}>
                    Email
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#F3EEE3" }}>
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "#0c1626", border: "1px solid rgba(228,206,143,0.12)" }}
                >
                  <Shield className="h-4 w-4" style={{ color: "#93A1B5" }} />
                </div>
                <div>
                  <p className="text-[11px] tracking-wider uppercase" style={{ color: "#5c6b81" }}>
                    Role
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#F3EEE3" }}>
                    {profile.admin_role?.name || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}