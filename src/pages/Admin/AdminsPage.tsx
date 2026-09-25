/** @format */
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  UserCog,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetAllAdminsAPI, DeleteAdminAPI } from "@/services/Api/AdminApi";

const LIMIT = 15;

interface Admin {
  id: number;
  name: string;
  email: string;
  created_at: string;
  admin_role?: { name: string };
}

const inputStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  color: "#101d30",
};

export default function Admins() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const token = localStorage.getItem("token") || "";

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GetAllAdminsAPI({ token, page: 1, limit: 10000 });
      setAdmins(res.data?.data || []);
    } catch (err: any) {
      toast({
        title: "Failed to load admins",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) => a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    );
  }, [admins, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await DeleteAdminAPI(id, token);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Admin deleted" });
    } catch (err: any) {
      toast({
        title: "Failed to delete",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-semibold" style={{ color: "#101d30" }}>
            <UserCog className="h-5 w-5" style={{ color: "#c9a227" }} />
            Admins
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
            Manage who has access to this dashboard.
          </p>
        </div>

        <button
          onClick={() => navigate("/admins/add")}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 flex-shrink-0"
          style={{ background: "#E4CE8F", color: "#101d30" }}
        >
          <Plus className="h-4 w-4" />
          Add admin
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #e2e5eb", boxShadow: "0 1px 3px rgba(16,29,48,0.06)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #edeff3" }}>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9aa3b2" }} />
            <Input
              placeholder="Search admins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 text-[13.5px]"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #edeff3" }}>
                {["Name", "Email", "Role", "Created", ""].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wider"
                    style={{ color: "#8993a6" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: "#9aa3b2" }} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-sm" style={{ color: "#9aa3b2" }}>
                    No admins found.
                  </td>
                </tr>
              ) : (
                paginated.map((a, idx) => (
                  <tr key={a.id} style={{ background: idx % 2 === 1 ? "#fafbfc" : "#ffffff" }}>
                    <td className="px-5 py-3 font-medium" style={{ color: "#101d30" }}>
                      {a.name}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      {a.email}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{ background: "#fbf3de", color: "#a3874f" }}
                      >
                        {a.admin_role?.name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admins/edit/${a.id}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "#8993a6" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f3f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: a.id, name: a.name })}
                          disabled={deletingId === a.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: "#c25b4a" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#fbeceb")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="Delete"
                        >
                          {deletingId === a.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #edeff3" }}>
            <p className="text-xs" style={{ color: "#9aa3b2" }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ color: "#6b7688", border: "1px solid #e2e5eb" }}
              >
                Previous
              </button>
              <span className="text-xs" style={{ color: "#9aa3b2" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ color: "#6b7688", border: "1px solid #e2e5eb" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(16,29,48,0.45)" }}
          onClick={() => deletingId === null && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#ffffff", boxShadow: "0 24px 60px -16px rgba(16,29,48,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center mb-3"
              style={{ background: "#fbeceb" }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color: "#c25b4a" }} />
            </div>
            <h3 className="text-[16px] font-semibold" style={{ color: "#101d30" }}>
              Delete admin?
            </h3>
            <p className="text-sm mt-1.5" style={{ color: "#6b7688" }}>
              This will permanently remove{" "}
              <span style={{ color: "#101d30", fontWeight: 500 }}>"{deleteTarget.name}"</span> and revoke their access.
              This can't be undone.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId !== null}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: "#f2f3f6", color: "#101d30" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                disabled={deletingId !== null}
                className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: "#c25b4a", color: "#ffffff" }}
              >
                {deletingId !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deletingId !== null ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}