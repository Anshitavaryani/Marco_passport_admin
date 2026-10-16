/** @format */
import { useState } from "react";
import { Link } from "react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Circle,
  LogOut,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChangePasswordAPI } from "@/services/Api/AuthApi";
import { clearSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const labelClass = "text-[11px] leading-6 tracking-wider uppercase text-ink-subtle";

// Advisory only: the backend just checks the fields are filled and match.
const STRENGTH_LEVELS = [
  { label: "Weak", bar: "bg-danger", text: "text-danger" },
  { label: "Fair", bar: "bg-gold-muted", text: "text-gold-dark" },
  { label: "Good", bar: "bg-gold", text: "text-gold-dark" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
];

const passwordStrength = (password: string) => {
  if (password.length < 8) return 1;
  let score = 1;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const TIPS = [
  "Use 12 or more characters",
  "Mix upper and lowercase letters, numbers and symbols",
  "Avoid names, dates and common words",
  "Don't reuse a password from another site",
];

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  children?: React.ReactNode;
}

function PasswordField({ id, label, value, onChange, placeholder, autoComplete, icon: Icon, disabled, children }: PasswordFieldProps) {
  const [shown, setShown] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={labelClass}>
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
        <Input
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className="h-10 rounded-lg pl-9 pr-10 text-[14px]"
        />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-gold-dark transition-colors"
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {children}
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2 text-[12.5px] transition-colors", ok ? "text-success" : "text-ink-faint")}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </li>
  );
}

export default function AdminChangePassword() {
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isDifferent = !!newPassword && newPassword !== currentPassword;
  const isMatching = !!confirmPassword && confirmPassword === newPassword;
  const strengthScore = newPassword ? passwordStrength(newPassword) : 0;
  const strength = strengthScore ? STRENGTH_LEVELS[strengthScore - 1] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (newPassword === currentPassword) {
      toast({ title: "Choose a new password", description: "It must be different from your current one.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await ChangePasswordAPI({
        old_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
        token,
      });

      if (res.data?.success) {
        setDone(true);
        toast({ title: "Password updated", description: "Please log in again with your new password." });
        clearSession();
        setTimeout(() => (window.location.href = "/"), 1500);
      }
    } catch (err: any) {
      toast({
        title: "Failed to update password",
        description: err.response?.data?.message || "Unexpected error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || done;

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-px w-5 bg-gold-muted opacity-70" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-gold-dark">Account Security</span>
        </div>
        <h1 className="text-[20px] font-semibold text-navy">Change password</h1>
        <p className="text-sm mt-1 text-ink-muted">Update your password to keep your account secure.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl overflow-hidden bg-white border border-line shadow-card">
          <div className="px-6 py-4 flex items-center gap-2 border-b border-line-soft">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <h2 className="text-[14px] font-semibold text-navy">Update your password</h2>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter your current password"
              autoComplete="current-password"
              icon={Lock}
              disabled={busy}
            />

            <div className="h-px bg-line-soft" />

            <div className="grid gap-5 md:grid-cols-2">
              <PasswordField
                id="new-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter a new password"
                autoComplete="new-password"
                icon={KeyRound}
                disabled={busy}
              >
                {strength && (
                  <div className="pt-1">
                    <div className="flex gap-1">
                      {STRENGTH_LEVELS.map((level, i) => (
                        <span
                          key={level.label}
                          className={cn("h-1 flex-1 rounded-full transition-colors", i < strengthScore ? strength.bar : "bg-fill")}
                        />
                      ))}
                    </div>
                    <p className="text-[11.5px] mt-1.5 text-ink-faint">
                      Strength: <span className={cn("font-medium", strength.text)}>{strength.label}</span>
                    </p>
                  </div>
                )}
              </PasswordField>

              <PasswordField
                id="confirm-password"
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter the new password"
                autoComplete="new-password"
                icon={KeyRound}
                disabled={busy}
              />
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              <Check ok={isDifferent}>Different from your current password</Check>
              <Check ok={isMatching}>Both new passwords match</Check>
            </ul>
          </div>

          <div className="px-6 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft bg-surface-muted">
            <p className="flex items-center gap-2 text-[12.5px] text-ink-muted">
              <LogOut className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
              You'll be signed out and asked to log in again.
            </p>
            <button
              type="submit"
              disabled={busy}
              className="h-10 px-5 rounded-lg font-semibold tracking-wide text-sm flex items-center gap-2 disabled:opacity-60 bg-gold-light text-navy hover:bg-gold-muted transition-colors"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              {done ? "Signing you out..." : loading ? "Updating..." : "Update password"}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl p-5 bg-linear-to-b from-navy-raised to-navy shadow-panel">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-gold-light" />
              <span className="text-[10px] tracking-wider uppercase text-mist">Password tips</span>
            </div>
            <p className="text-[15px] font-semibold mb-3 text-cream">Make it hard to guess</p>
            <ul className="space-y-2">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-ink-ghost">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px text-gold-light" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-5 bg-white border border-line shadow-card">
            <p className="text-[14px] font-semibold text-navy">Forgot your current password?</p>
            <p className="text-xs mt-1 text-ink-faint">We can email you a code to reset it instead.</p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-medium text-gold-dark hover:text-gold-deep transition-colors"
            >
              Reset by email
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
