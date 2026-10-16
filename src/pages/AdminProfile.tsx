/** @format */
import { Link } from "react-router";
import { User, Mail, Shield, ShieldCheck, KeyRound, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { useAdminProfile } from "@/hooks/use-admin-profile";
import { ROLE, ROLE_ACCESS } from "@/lib/adminRoles";
import { getInitials } from "@/lib/utils";

const labelClass = "text-[11px] tracking-wider uppercase text-ink-subtle";

export default function AdminProfile() {
  // Same request the header and sidebar already made, so this is usually instant.
  const { profile, loading, abbreviation } = useAdminProfile();

  if (loading) {
    return (
      <div className="w-full px-6 py-16 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full px-6 py-16 text-center text-sm text-ink-faint">
        Couldn't load your profile. Refresh the page to try again.
      </div>
    );
  }

  const roleName = profile.admin_role?.name || "No role";
  const access = ROLE_ACCESS[abbreviation ?? ""] ?? [];

  const details = [
    { label: "Full name", value: profile.name, icon: User },
    { label: "Email address", value: profile.email, icon: Mail },
    { label: "Role", value: roleName, icon: Shield },
  ];

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-px w-5 bg-gold-muted opacity-70" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-gold-dark">Account</span>
        </div>
        <h1 className="text-[20px] font-semibold text-navy">My profile</h1>
        <p className="text-sm mt-1 text-ink-muted">Your admin account details and what you can access.</p>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl overflow-hidden mb-5 bg-white border border-line shadow-card">
        <div className="h-24 bg-auth-backdrop relative">
          <span className="absolute inset-x-0 bottom-0 h-px bg-gold-light/30" />
        </div>
        <div className="px-6 pb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="relative -mt-10 h-20 w-20 shrink-0 rounded-full flex items-center justify-center bg-linear-to-b from-gold-light to-gold-muted ring-4 ring-white shadow-card">
              <span className="font-display italic text-[28px] font-semibold text-navy">
                {getInitials(profile.name) || <User className="h-7 w-7" />}
              </span>
            </div>
            <div className="min-w-0 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[18px] font-semibold text-navy break-words">{profile.name}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gold-soft text-gold-dark ring-1 ring-gold-light/50">
                  <ShieldCheck className="h-3 w-3" />
                  {roleName}
                </span>
              </div>
              <p className="text-[13px] mt-0.5 text-ink-muted break-all">{profile.email}</p>
            </div>
          </div>
          <Link
            to="/change-password"
            className="h-9 px-4 rounded-lg text-[13px] font-semibold flex items-center gap-2 bg-fill text-navy hover:bg-line-soft transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Change password
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Account details */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden bg-white border border-line shadow-card">
          <div className="px-6 py-4 flex items-center gap-2 border-b border-line-soft">
            <User className="h-4 w-4 text-gold" />
            <h2 className="text-[14px] font-semibold text-navy">Account details</h2>
          </div>
          <dl className="divide-y divide-line-soft">
            {details.map((row) => (
              <div key={row.label} className="px-6 py-4 flex items-center gap-4">
                <div className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center bg-gold-soft">
                  <row.icon className="h-4 w-4 text-gold-dark" />
                </div>
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
                  <dt className={`${labelClass} sm:w-36 sm:shrink-0`}>{row.label}</dt>
                  <dd className="text-[14px] text-navy break-words">{row.value}</dd>
                </div>
              </div>
            ))}
          </dl>
          {abbreviation !== ROLE.SUPER_ADMIN && (
            <p className="px-6 py-3 text-[12px] text-ink-faint bg-surface-muted border-t border-line-soft">
              Your name and role are managed by a Super Admin.
            </p>
          )}
        </div>

        <div className="space-y-5">
          {/* Access level */}
          <div className="rounded-2xl p-5 bg-linear-to-b from-navy-raised to-navy shadow-panel">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-gold-light" />
              <span className="text-[10px] tracking-wider uppercase text-mist">Access level</span>
            </div>
            <p className="text-[15px] font-semibold mb-3 text-cream">{roleName}</p>
            {access.length > 0 ? (
              <ul className="space-y-2">
                {access.map((line) => (
                  <li key={line} className="flex items-center gap-2 text-xs text-ink-ghost">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gold-light" />
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-mist">No permissions are listed for this role.</p>
            )}
          </div>

          {/* Security shortcut */}
          <Link
            to="/change-password"
            className="group flex items-center gap-3 rounded-2xl p-5 bg-white border border-line shadow-card hover:border-gold-light transition-colors"
          >
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-gold-soft">
              <KeyRound className="h-[18px] w-[18px] text-gold-dark" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-navy">Password</p>
              <p className="text-xs mt-0.5 text-ink-faint">Change it regularly to keep your account safe.</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-ghost group-hover:text-gold-dark transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
