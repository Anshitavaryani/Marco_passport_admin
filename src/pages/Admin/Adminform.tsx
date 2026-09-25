/** @format */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  ShieldCheck,
  ArrowLeft,
  Send,
  CheckCircle2,
  Lock,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AddAdminAPI, GetAdminByIdAPI, UpdateAdminAPI } from "@/services/Api/AdminApi";

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  boxShadow: "0 1px 3px rgba(16,29,48,0.06)",
};
const inputStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  color: "#101d30",
};
const labelClass = "text-[11px] tracking-wider uppercase";
const labelStyle = { color: "#8993a6" };

export default function AdminForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    if (id) loadAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAdmin = async () => {
    try {
      setLoading(true);
      const res = await GetAdminByIdAPI(id as string, token);
      const admin = res.data?.data;
      setFormData({ name: admin?.name || "", email: admin?.email || "" });
    } catch (err: any) {
      toast({
        title: "Failed to load admin",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || (!isEdit && !formData.email.trim())) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      if (isEdit) {
        // Email is locked once created — only name is ever sent on update
        await UpdateAdminAPI(id as string, { name: formData.name.trim() }, token);
        toast({ title: "Admin updated" });
      } else {
        await AddAdminAPI({ name: formData.name.trim(), email: formData.email.trim() }, token);
        toast({ title: "Invitation sent" });
      }
      navigate("/admins");
    } catch (err: any) {
      toast({
        title: isEdit ? "Failed to update admin" : "Failed to invite admin",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-16 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#9aa3b2" }} />
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <button
        onClick={() => navigate("/admins")}
        className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity"
        style={{ color: "#6b7688" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to admins
      </button>

      <div className="mb-6">
        <h1 className="text-[20px] font-semibold" style={{ color: "#101d30" }}>
          {isEdit ? "Edit admin" : "Add admin"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
          {isEdit ? "Update basic information for this administrator." : "Invite a new member to the management team."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8 space-y-5" style={cardStyle}>
          <div className="space-y-1.5">
            <Label className={labelClass} style={labelStyle}>
              Full name <span style={{ color: "#c9a227" }}>*</span>
            </Label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "#9aa3b2" }}
              />
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                className="h-10 rounded-lg pl-9 text-[14px]"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass} style={labelStyle}>
              Email address {isEdit && <span style={{ color: "#c2c7d1" }}>(non-editable)</span>}
            </Label>
            <div className="relative">
              {isEdit ? (
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9aa3b2" }} />
              ) : (
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9aa3b2" }} />
              )}
              <Input
                type="email"
                value={formData.email}
                readOnly={isEdit}
                onChange={(e) => !isEdit && setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@themarcopassport.com"
                className="h-10 rounded-lg pl-9 text-[14px]"
                style={isEdit ? { ...inputStyle, background: "#f8f9fb", color: "#8993a6" } : inputStyle}
                required
              />
            </div>
            {isEdit && (
              <p className="text-[11px]" style={{ color: "#9aa3b2" }}>
                Email addresses are tied to the account identity and cannot be changed.
              </p>
            )}
          </div>

          {!isEdit && (
            <div
              className="flex gap-3 rounded-xl p-4"
              style={{ background: "#fbf3de", border: "1px solid rgba(228,206,143,0.4)" }}
            >
              <Send className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#a3874f" }} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#7a6538" }}>
                  Invitation logic
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8a7448" }}>
                  A setup link will be emailed to the user to create their password.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={{ background: "#101d30" }}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4" style={{ color: "#E4CE8F" }} />
              <span className="text-[10px] tracking-wider uppercase" style={{ color: "#8993a6" }}>
                Access level
              </span>
            </div>
            <p className="text-[15px] font-semibold mb-3" style={{ color: "#F3EEE3" }}>
              Super Administrator
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs" style={{ color: "#c9d1de" }}>
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#E4CE8F" }} />
                Full system access
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "#c9d1de" }}>
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#E4CE8F" }} />
                Audit permissions
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-lg font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#E4CE8F", color: "#101d30" }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Saving..." : isEdit ? "Update changes" : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admins")}
              className="w-full h-10 rounded-lg font-semibold text-sm tracking-wide"
              style={{ background: "#f2f3f6", color: "#101d30" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}