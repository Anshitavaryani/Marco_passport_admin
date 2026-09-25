/** @format */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Pencil, Trash2, Building2, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetBusinessesAPI, DeleteBusinessAPI } from "@/services/Api/BusinessApi";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";

interface Business {
  id: number;
  name: string;
  address?: string;
  featured_image?: string | null;
  categories?: { id: number; name: string }[];
}

const LIMIT = 15;

const inputStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  color: "#101d30",
};

export default function Businesses() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const token = localStorage.getItem("token") || "";

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GetBusinessesAPI({ token, page, limit: LIMIT, search });
      if (res.data?.success) {
        setBusinesses(res.data?.data?.places || []);
        setCount(res.data?.data?.total || 0);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load businesses",
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
      fetchBusinesses();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (id: number, name: string) => {
    try {
      setDeletingId(id);
      const res = await DeleteBusinessAPI(id, token);
      if (res.data?.success) {
        toast({ title: "Business deleted" });
        fetchBusinesses();
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
          <h1 className="flex items-center gap-2 text-[20px] font-semibold" style={{ color: "#101d30" }}>
            <Building2 className="h-5 w-5" style={{ color: "#c9a227" }} />
            Businesses
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
            Manage the businesses listed across the Marco Passport.
          </p>
        </div>

        <button
          onClick={() => navigate("/businesses/add")}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 flex-shrink-0"
          style={{ background: "#E4CE8F", color: "#101d30" }}
        >
          <Plus className="h-4 w-4" />
          Add business
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e5eb",
          boxShadow: "0 1px 3px rgba(16,29,48,0.06)",
        }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #edeff3" }}>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9aa3b2" }} />
            <Input
              placeholder="Search businesses..."
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
                {["", "Name", "Category", "Address", ""].map((h, i) => (
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
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-sm" style={{ color: "#9aa3b2" }}>
                    No businesses found.
                  </td>
                </tr>
              ) : (
                businesses.map((business, idx) => (
                  <tr key={business.id} style={{ background: idx % 2 === 1 ? "#fafbfc" : "#ffffff" }}>
                    <td className="px-5 py-3">
                      <div
                        className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                        style={{ background: "#f2f3f6", border: "1px solid #e8eaef" }}
                      >
                        {business.featured_image ? (
                          <img
                            src={`${IMAGE_BASE_URL}${business.featured_image}`}
                            alt={business.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-4 w-4" style={{ color: "#c2c7d1" }} />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: "#101d30" }}>
                      {business.name}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      {business.categories?.[0]?.name || "—"}
                    </td>
                    <td className="px-5 py-3 max-w-[240px] truncate" style={{ color: "#6b7688" }}>
                      {business.address || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/businesses/${business.id}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "#8993a6" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f3f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/businesses/${business.id}/edit`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "#8993a6" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f3f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: business.id, name: business.name })}
                          disabled={deletingId === business.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: "#c25b4a" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#fbeceb")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="Delete"
                        >
                          {deletingId === business.id ? (
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
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #edeff3" }}>
            <p className="text-xs" style={{ color: "#9aa3b2" }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, count)} of {count}
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
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ background: "rgba(16,29,48,0.45)", zIndex: 100000 }}
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
              Delete business?
            </h3>
            <p className="text-sm mt-1.5" style={{ color: "#6b7688" }}>
              This will permanently remove{" "}
              <span style={{ color: "#101d30", fontWeight: 500 }}>"{deleteTarget.name}"</span>. This can't be undone.
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
                onClick={() => handleDelete(deleteTarget.id, deleteTarget.name)}
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