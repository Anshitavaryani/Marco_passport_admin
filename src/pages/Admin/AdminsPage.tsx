/** @format */
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
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
          <h1 className="flex items-center gap-2 text-[20px] font-semibold text-navy">
            <UserCog className="h-5 w-5 text-gold" />
            Admins
          </h1>
          <p className="text-sm mt-1 text-ink-muted">
            Manage who has access to this dashboard.
          </p>
        </div>

        <button
          onClick={() => navigate("/admins/add")}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 shrink-0 bg-gold-light text-navy"
        >
          <Plus className="h-4 w-4" />
          Add admin
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden bg-white border border-line shadow-card"
      >
        <div className="px-5 py-4 border-b border-line-soft">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <Input
              placeholder="Search admins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 text-[13.5px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted border-b border-line-soft">
                {["Name", "Email", "Role", "Created", ""].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wider text-ink-subtle"
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
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-ink-faint" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-sm text-ink-faint">
                    No admins found.
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a.id} className="bg-white even:bg-surface-subtle">
                    <td className="px-5 py-3 font-medium text-navy">
                      {a.name}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {a.email}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold-soft text-gold-dark"
                      >
                        {a.admin_role?.name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admins/edit/${a.id}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-ink-subtle hover:bg-fill"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: a.id, name: a.name })}
                          disabled={deletingId === a.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 text-danger hover:bg-danger-soft"
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-line-soft">
            <p className="text-xs text-ink-faint">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-40 text-ink-muted border border-line"
              >
                Previous
              </button>
              <span className="text-xs text-ink-faint">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-40 text-ink-muted border border-line"
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
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy/45"
          onClick={() => deletingId === null && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 bg-white shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center mb-3 bg-danger-soft"
            >
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <h3 className="text-[16px] font-semibold text-navy">
              Delete admin?
            </h3>
            <p className="text-sm mt-1.5 text-ink-muted">
              This will permanently remove{" "}
              <span className="text-navy font-medium">"{deleteTarget.name}"</span> and revoke their access.
              This can't be undone.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId !== null}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50 bg-fill text-navy"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                disabled={deletingId !== null}
                className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70 bg-danger text-white"
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