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

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-px w-5 bg-gold-muted opacity-70" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-gold-dark">
            Account
          </span>
        </div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold text-navy">
          <User className="h-5 w-5 text-gold" />
          My profile
        </h1>
        <p className="text-sm mt-1 text-ink-muted">
          Your admin account details.
        </p>
      </div>

      <div
        className="max-w-2xl rounded-2xl overflow-hidden bg-linear-to-b from-navy-raised/96 to-navy/96 border border-gold-light/16 shadow-panel"
      >
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-dusk" />
          </div>
        ) : !profile ? (
          <div className="py-16 text-center text-sm text-dusk">
            Couldn't load profile.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 px-6 py-6 border-b border-gold-light/12">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 bg-linear-to-b from-gold-light to-gold-muted"
              >
                <span
                  className="italic font-display text-navy text-[20px] font-semibold"
                >
                  {initials(profile.name)}
                </span>
              </div>
              <div>
                <p className="text-[17px] font-semibold text-cream">
                  {profile.name}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gold-light/14 text-gold-light"
                >
                  <Shield className="h-3 w-3" />
                  {profile.admin_role?.name || "N/A"}
                </span>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-navy-inset border border-gold-light/12"
                >
                  <User className="h-4 w-4 text-mist" />
                </div>
                <div>
                  <p className="text-[11px] tracking-wider uppercase text-dusk">
                    Name
                  </p>
                  <p className="text-sm mt-0.5 text-cream">
                    {profile.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-navy-inset border border-gold-light/12"
                >
                  <Mail className="h-4 w-4 text-mist" />
                </div>
                <div>
                  <p className="text-[11px] tracking-wider uppercase text-dusk">
                    Email
                  </p>
                  <p className="text-sm mt-0.5 text-cream">
                    {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-navy-inset border border-gold-light/12"
                >
                  <Shield className="h-4 w-4 text-mist" />
                </div>
                <div>
                  <p className="text-[11px] tracking-wider uppercase text-dusk">
                    Role
                  </p>
                  <p className="text-sm mt-0.5 text-cream">
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