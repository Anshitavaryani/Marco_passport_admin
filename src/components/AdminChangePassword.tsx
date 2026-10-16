/** @format */
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChangePasswordAPI } from "@/services/Api/AuthApi";

const fieldLabelClass = "text-[11px] tracking-wider uppercase flex items-center gap-1.5";

export default function AdminChangePassword() {
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "All fields are required", variant: "destructive" });
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
        toast({ title: "Password updated", description: "You can now log in with your new password." });
        localStorage.removeItem("token");
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

  const eyeToggle = (shown: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-dusk hover:text-gold-light"
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-px w-5 bg-gold-muted opacity-70" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-gold-dark">
            Account Security
          </span>
        </div>
        <h1 className="flex items-center gap-2 text-[20px] font-semibold text-navy">
          <ShieldCheck className="h-5 w-5 text-gold" />
          Change password
        </h1>
        <p className="text-sm mt-1 text-ink-muted">
          Update your password to keep your account secure.
        </p>
      </div>

      <div
        className="max-w-2xl rounded-2xl overflow-hidden bg-linear-to-b from-navy-raised/96 to-navy/96 border border-gold-light/16 shadow-panel"
      >
        <div className="px-6 py-6 space-y-5">
          <div className="space-y-1.5">
            <Label className={`${fieldLabelClass} text-mist`}>
              <Lock className="h-3.5 w-3.5" />
              Current password
            </Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-10 rounded-lg pr-10 text-[14px] bg-navy-inset border-gold-light/15 text-cream"
              />
              {eyeToggle(showCurrent, () => setShowCurrent(!showCurrent))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className={`${fieldLabelClass} text-mist`}>
                New password
              </Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-10 rounded-lg pr-10 text-[14px] bg-navy-inset border-gold-light/15 text-cream"
                />
                {eyeToggle(showNew, () => setShowNew(!showNew))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={`${fieldLabelClass} text-mist`}>
                Confirm new password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-10 rounded-lg pr-10 text-[14px] bg-navy-inset border-gold-light/15 text-cream"
                />
                {eyeToggle(showConfirm, () => setShowConfirm(!showConfirm))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleChangePassword}
              disabled={loading}
              className="h-10 px-5 rounded-lg font-semibold tracking-wide text-sm flex items-center gap-2 disabled:opacity-60 bg-gold-light text-navy"
            >
              <Lock className="h-3.5 w-3.5" />
              {loading ? "Updating..." : "Change password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}