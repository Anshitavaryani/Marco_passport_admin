/** @format */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
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
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 400;

const STATUS_BADGE: Record<string, string> = {
  accepted: "bg-gold-soft text-gold-dark",
  rejected: "bg-danger-soft text-danger",
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
          <h1 className="flex items-center gap-2 text-[20px] font-semibold text-navy">
            <UsersIcon className="h-5 w-5 text-gold" />
            Users
          </h1>
          <p className="text-sm mt-1 text-ink-muted">
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
              className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 bg-danger-soft text-danger"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white border border-line shadow-card">
        <div className="px-5 py-4 border-b border-line-soft">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 pr-8 text-[13.5px]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted border-b border-line-soft">
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded accent-gold"
                  />
                </th>
                {["Name", "Email", "Mobile", "Activity", "Status", "Joined", ""].map((h, i) => (
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
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-ink-faint" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-sm text-ink-faint">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="bg-white even:bg-surface-subtle"
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleSelectOne(u.id)}
                        className="h-4 w-4 rounded accent-gold"
                      />
                    </td>
                    <td className="px-5 py-3 font-medium text-navy">
                      {u.user_profile?.name || "Unnamed User"}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {u.email}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {u.user_profile?.mobile || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 text-[12.5px] text-ink-muted">
                        <span className="flex items-center gap-1" title="Reviews">
                          <Star className="h-3.5 w-3.5 text-gold" />
                          {u.reviews_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1" title="Itineraries">
                          <Route className="h-3.5 w-3.5 text-gold" />
                          {u.itineraries_count ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
                          STATUS_BADGE[u.status?.toLowerCase()] ?? "bg-fill text-ink-subtle",
                        )}
                      >
                        {u.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {formatDate(u.user_profile?.created_at || u.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/users/${u.id}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-ink-subtle hover:bg-fill"
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
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-danger hover:bg-danger-soft"
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
          className="flex items-center justify-between px-5 py-4 border-t border-line-soft"
        >
          <span className="text-[12.5px] text-ink-faint">
            {totalCount} user{totalCount !== 1 ? "s" : ""} total
          </span>
          <div className="flex items-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-40 border border-line text-ink-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12.5px] text-ink-muted">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-40 border border-line text-ink-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal — same AlertTriangle pattern as PlaceCategories */}
      {deleteTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4 bg-navy/45 z-[100000]"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 bg-white shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-10 w-10 rounded-full flex items-center justify-center mb-3 bg-danger-soft">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <h3 className="text-[16px] font-semibold text-navy">
              {deleteTarget.ids.length > 1 ? "Delete users?" : "Delete user?"}
            </h3>
            <p className="text-sm mt-1.5 text-ink-muted">
              This will permanently remove{" "}
              <span className="text-navy font-medium">"{deleteTarget.label}"</span>. This can't be undone.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50 bg-fill text-navy"
              >
                Cancel
              </button>
              <button
                onClick={runDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70 bg-danger text-white"
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