/** @format */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Pencil, Trash2, MapPin, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetPlacesAPI, DeletePlaceAPI } from "@/services/Api/PlacesApi";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";

interface Place {
  id: number;
  name: string;
  slug?: string;
  address?: string;
  is_active?: boolean;
  featured_image?: string | null;
  categories?: { id: number; name: string; slug?: string; type?: string }[];
}

const LIMIT = 15;

export default function Places() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [places, setPlaces] = useState<Place[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const token = localStorage.getItem("token") || "";

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GetPlacesAPI({ token, page, limit: LIMIT, search });
      if (res.data?.success) {
        setPlaces(res.data?.data?.places || []);
        setCount(res.data?.data?.total || 0);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load places",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPlaces();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    fetchPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      const res = await DeletePlaceAPI(id, token);
      if (res.data?.success) {
        toast({ title: "Place deleted" });
        fetchPlaces();
      }
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

  const totalPages = Math.max(1, Math.ceil(count / LIMIT));

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">

      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-semibold text-navy">
            <MapPin className="h-5 w-5 text-gold" />
            Places
          </h1>
          <p className="text-sm mt-1 text-ink-muted">
            Manage the places listed across the Marco Passport.
          </p>
        </div>

        <button
          onClick={() => navigate("/places/add")}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 shrink-0 bg-gold-light text-navy"
        >
          <Plus className="h-4 w-4" />
          Add place
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden bg-white border border-line shadow-card"
      >
        <div className="px-5 py-4 border-b border-line-soft">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <Input
              placeholder="Search places..."
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
                {["", "Name", "Category", "Address", ""].map((h, i) => (
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
              ) : places.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-sm text-ink-faint">
                    No places found.
                  </td>
                </tr>
              ) : (
                places.map((place) => (
                  <tr
                    key={place.id}
                    className="bg-white even:bg-surface-subtle"
                  >
                    <td className="px-5 py-3">
                      <div
                        className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-fill border border-line"
                      >
                        {place.featured_image ? (
                          <img
                            src={`${IMAGE_BASE_URL}${place.featured_image}`}
                            alt={place.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <MapPin className="h-4 w-4 text-ink-ghost" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-navy">
                      {place.name}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {place.categories?.[0]?.name || "—"}
                    </td>
                    <td className="px-5 py-3 max-w-[240px] truncate text-ink-muted">
                      {place.address || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/places/${place.id}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-ink-subtle hover:bg-fill"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/places/${place.id}/edit`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-ink-subtle hover:bg-fill"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: place.id, name: place.name })}
                          disabled={deletingId === place.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 text-danger hover:bg-danger-soft"
                          title="Delete"
                        >
                          {deletingId === place.id ? (
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

        {!loading && count > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3 border-t border-line-soft"
          >
            <p className="text-xs text-ink-faint">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, count)} of {count}
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
          className="fixed inset-0 flex items-center justify-center px-4 bg-navy/45 z-[100000]"
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
              Delete place?
            </h3>
            <p className="text-sm mt-1.5 text-ink-muted">
              This will permanently remove{" "}
              <span className="text-navy font-medium">"{deleteTarget.name}"</span>. This can't be undone.
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