/** @format */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Users as UsersIcon,
  Star,
  Route,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { GetAllUsersAPI, DeleteUserAPI } from "@/services/Api/UserApi";

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

// --- shared style tokens (matches PlaceCategories.tsx) ---
const inputStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  color: "#101d30",
};
const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  boxShadow: "0 1px 3px rgba(16,29,48,0.06)",
};

interface UserRow {
  id: number;
  email: string;
  status: string;
  created_at?: string;
  user_profile?: {
    name?: string;
    mobile?: string;
    created_at?: string;
  };
  reviews_count?: number;
  itineraries_count?: number;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: number[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (pageArg: number, searchArg: string) => {
    try {
      setLoading(true);
      const res = await GetAllUsersAPI({
        page: pageArg,
        limit: PAGE_LIMIT,
        search: searchArg || undefined,
      });
      const payload = res.data?.data;
      setUsers(payload?.rows || []);
      setTotalCount(payload?.count || 0);
    } catch (err: any) {
      toast({
        title: "Failed to load users",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, fetchUsers]);

  // debounced search -> reset to page 1
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, search);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_LIMIT));

  const allOnPageSelected = useMemo(
    () => users.length > 0 && users.every((u) => selectedIds.includes(u.id)),
    [users, selectedIds]
  );

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !users.some((u) => u.id === id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...users.map((u) => u.id)])));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const runDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await DeleteUserAPI(deleteTarget.ids);
      toast({ title: deleteTarget.ids.length > 1 ? "Users deleted" : "User deleted" });
      setSelectedIds((prev) => prev.filter((id) => !deleteTarget.ids.includes(id)));
      setDeleteTarget(null);
      // if we just deleted the last item on a page beyond page 1, step back
      const isLastRowOnPage = users.length === deleteTarget.ids.length && page > 1;
      const nextPage = isLastRowOnPage ? page - 1 : page;
      setPage(nextPage);
      fetchUsers(nextPage, search);
    } catch (err: any) {
      toast({
        title: "Failed to delete",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-semibold" style={{ color: "#101d30" }}>
            <UsersIcon className="h-5 w-5" style={{ color: "#c9a227" }} />
            Users
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
            Users who left a review or created an itinerary.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <button
              onClick={() =>
                setDeleteTarget({
                  ids: selectedIds,
                  label: `${selectedIds.length} selected user${selectedIds.length > 1 ? "s" : ""}`,
                })
              }
              className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2"
              style={{ background: "#fbeceb", color: "#c25b4a" }}
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #edeff3" }}>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9aa3b2" }} />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 pr-8 text-[13.5px]"
              style={inputStyle}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "#9aa3b2" }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #edeff3" }}>
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: "#c9a227" }}
                  />
                </th>
                {["Name", "Email", "Mobile", "Activity", "Status", "Joined", ""].map((h, i) => (
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
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: "#9aa3b2" }} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-sm" style={{ color: "#9aa3b2" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr
                    key={u.id}
                    style={{ background: idx % 2 === 1 ? "#fafbfc" : "#ffffff" }}
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleSelectOne(u.id)}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: "#c9a227" }}
                      />
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: "#101d30" }}>
                      {u.user_profile?.name || "Unnamed User"}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      {u.email}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      {u.user_profile?.mobile || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 text-[12.5px]" style={{ color: "#6b7688" }}>
                        <span className="flex items-center gap-1" title="Reviews">
                          <Star className="h-3.5 w-3.5" style={{ color: "#c9a227" }} />
                          {u.reviews_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1" title="Itineraries">
                          <Route className="h-3.5 w-3.5" style={{ color: "#c9a227" }} />
                          {u.itineraries_count ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={
                          u.status?.toLowerCase() === "accepted"
                            ? { background: "#fbf3de", color: "#a3874f" }
                            : u.status?.toLowerCase() === "rejected"
                            ? { background: "#fbeceb", color: "#c25b4a" }
                            : { background: "#f1f2f5", color: "#8993a6" }
                        }
                      >
                        {u.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      {formatDate(u.user_profile?.created_at || u.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/users/${u.id}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "#8993a6" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f3f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              ids: [u.id],
                              label: u.user_profile?.name || u.email,
                            })
                          }
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "#c25b4a" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#fbeceb")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderTop: "1px solid #edeff3" }}
        >
          <span className="text-[12.5px]" style={{ color: "#9aa3b2" }}>
            {totalCount} user{totalCount !== 1 ? "s" : ""} total
          </span>
          <div className="flex items-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-40"
              style={{ border: "1px solid #e2e5eb", color: "#6b7688" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12.5px]" style={{ color: "#6b7688" }}>
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-40"
              style={{ border: "1px solid #e2e5eb", color: "#6b7688" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal — same AlertTriangle pattern as PlaceCategories */}
      {deleteTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ background: "rgba(16,29,48,0.45)", zIndex: 100000 }}
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#ffffff", boxShadow: "0 24px 60px -16px rgba(16,29,48,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-10 w-10 rounded-full flex items-center justify-center mb-3" style={{ background: "#fbeceb" }}>
              <AlertTriangle className="h-5 w-5" style={{ color: "#c25b4a" }} />
            </div>
            <h3 className="text-[16px] font-semibold" style={{ color: "#101d30" }}>
              {deleteTarget.ids.length > 1 ? "Delete users?" : "Delete user?"}
            </h3>
            <p className="text-sm mt-1.5" style={{ color: "#6b7688" }}>
              This will permanently remove{" "}
              <span style={{ color: "#101d30", fontWeight: 500 }}>"{deleteTarget.label}"</span>. This can't be undone.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: "#f2f3f6", color: "#101d30" }}
              >
                Cancel
              </button>
              <button
                onClick={runDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: "#c25b4a", color: "#ffffff" }}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}