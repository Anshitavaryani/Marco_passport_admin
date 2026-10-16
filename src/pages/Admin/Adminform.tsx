/** @format */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import {
  AddAdminAPI,
  GetAdminByIdAPI,
  GetDepartmentsAPI,
  GetRolesAPI,
  UpdateAdminAPI,
} from "@/services/Api/AdminApi";
import { PANEL_ROLES, ROLE } from "@/lib/adminRoles";
import { cn } from "@/lib/utils";

interface Role {
  id: number;
  name: string;
  abbreviation: string;
}
interface Department {
  id: number;
  name: string;
}

const ROLE_ACCESS: Record<string, string[]> = {
  [ROLE.SUPER_ADMIN]: ["Full system access", "Admin accounts and roles"],
  [ROLE.ADMIN]: ["Users, places and businesses", "Blogs, categories and submissions"],
  [ROLE.SUB_ADMIN]: ["Users, places and businesses", "Blogs, categories and submissions"],
  [ROLE.ENGINEER]: ["FAQs", "Own profile and password"],
  [ROLE.EDITOR]: ["FAQs", "Own profile and password"],
};

const labelClass = "text-[11px] leading-6 tracking-wider uppercase text-ink-subtle";

export default function AdminForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role_id: "", department_id: "" });
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    if (id) loadAdmin();
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOptions = async () => {
    try {
      const [rolesRes, deptRes] = await Promise.all([GetRolesAPI(token), GetDepartmentsAPI(token)]);
      setRoles(rolesRes.data?.data || []);
      setDepartments(deptRes.data?.data || []);
    } catch (err: any) {
      toast({
        title: "Failed to load roles",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  // Only admin-panel roles can be assigned, and never Super Admin: the backend
  // refuses it on create, so it's hidden on edit too.
  const assignableRoles = roles.filter(
    (r) => PANEL_ROLES.includes(r.abbreviation) && r.abbreviation !== ROLE.SUPER_ADMIN,
  );
  const selectedRole = roles.find((r) => String(r.id) === formData.role_id);
  const isSuperAdminAccount = selectedRole?.abbreviation === ROLE.SUPER_ADMIN;

  const loadAdmin = async () => {
    try {
      setLoading(true);
      const res = await GetAdminByIdAPI(id as string, token);
      const admin = res.data?.data;
      setFormData({
        name: admin?.name || "",
        email: admin?.email || "",
        role_id: admin?.role_id ? String(admin.role_id) : "",
        department_id: admin?.department_id ? String(admin.department_id) : "",
      });
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
    if (!formData.role_id || (!isEdit && !formData.department_id)) {
      toast({ title: "Role and department are required", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      if (isEdit) {
        // Email is locked once created; the department can't be changed via the API.
        await UpdateAdminAPI(
          id as string,
          {
            name: formData.name.trim(),
            ...(isSuperAdminAccount ? {} : { role_id: Number(formData.role_id) }),
          },
          token,
        );
        toast({ title: "Admin updated" });
      } else {
        await AddAdminAPI(
          {
            name: formData.name.trim(),
            email: formData.email.trim(),
            role_id: Number(formData.role_id),
            department_id: Number(formData.department_id),
          },
          token,
        );
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
        <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <button
        onClick={() => navigate("/admins")}
        className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity text-ink-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to admins
      </button>

      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-navy">
          {isEdit ? "Edit admin" : "Add admin"}
        </h1>
        <p className="text-sm mt-1 text-ink-muted">
          {isEdit ? "Update basic information for this administrator." : "Invite a new member to the management team."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 rounded-2xl p-6 md:p-8 space-y-5 bg-white border border-line shadow-card">
          <div className="space-y-1.5">
            <Label className={labelClass}>
              Full name <span className="text-gold">*</span>
            </Label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint"
              />
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                className="h-10 rounded-lg pl-9 text-[14px]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>
              Email address {isEdit && <span className="text-ink-ghost">(non-editable)</span>}
            </Label>
            <div className="relative">
              {isEdit ? (
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
              ) : (
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
              )}
              <Input
                type="email"
                value={formData.email}
                readOnly={isEdit}
                onChange={(e) => !isEdit && setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@themarcopassport.com"
                className={cn("h-10 rounded-lg pl-9 text-[14px]", isEdit && "bg-surface-muted text-ink-subtle")}
                required
              />
            </div>
            {isEdit && (
              <p className="text-[11px] text-ink-faint">
                Email addresses are tied to the account identity and cannot be changed.
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className={labelClass}>
                Role <span className="text-gold">*</span>
              </Label>
              {isSuperAdminAccount ? (
                <Input
                  value={selectedRole?.name || "Super Admin"}
                  readOnly
                  className="h-10 rounded-lg text-[14px] bg-surface-muted text-ink-subtle"
                />
              ) : (
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  className={cn("w-full h-10 rounded-lg text-[14px] px-3 outline-hidden cursor-pointer bg-white border border-line", formData.role_id ? "text-navy" : "text-ink-faint")}
                  required
                >
                  <option value="">Select a role</option>
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.id} className="text-navy">
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={labelClass}>
                Department{" "}
                {isEdit ? (
                  <span className="text-ink-ghost">(non-editable)</span>
                ) : (
                  <span className="text-gold">*</span>
                )}
              </Label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                disabled={isEdit}
                className={cn(
                  "w-full h-10 rounded-lg text-[14px] px-3 outline-hidden cursor-pointer disabled:cursor-default border border-line",
                  isEdit ? "bg-surface-muted text-ink-subtle" : formData.department_id ? "bg-white text-navy" : "bg-white text-ink-faint",
                )}
                required={!isEdit}
              >
                <option value="">{isEdit ? "—" : "Select a department"}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="text-navy">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div
              className="flex gap-3 rounded-xl p-4 bg-gold-soft border border-gold-light/40"
            >
              <Send className="h-4 w-4 shrink-0 mt-0.5 text-gold-dark" />
              <div>
                <p className="text-[13px] font-semibold text-gold-deep">
                  Invitation logic
                </p>
                <p className="text-xs mt-0.5 text-gold-deep">
                  A temporary password will be emailed to the new admin. They can change it after signing in.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-2xl p-5 bg-navy">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-gold-light" />
              <span className="text-[10px] tracking-wider uppercase text-ink-subtle">
                Access level
              </span>
            </div>
            <p className="text-[15px] font-semibold mb-3 text-cream">
              {selectedRole?.name || "No role selected"}
            </p>
            <div className="space-y-2">
              {(ROLE_ACCESS[selectedRole?.abbreviation ?? ""] ?? []).map((line) => (
                <div key={line} className="flex items-center gap-2 text-xs text-ink-ghost">
                  <CheckCircle2 className="h-3.5 w-3.5 text-gold-light" />
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-lg font-semibold text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-60 bg-gold-light text-navy"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Saving..." : isEdit ? "Update changes" : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admins")}
              className="w-full h-10 rounded-lg font-semibold text-sm tracking-wide bg-fill text-navy"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}