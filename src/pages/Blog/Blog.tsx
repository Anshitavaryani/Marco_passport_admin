/** @format */
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Pencil, Trash2, Newspaper, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetBlogsAPI, DeleteBlogAPI } from "@/services/Api/BlogApi";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";
const LIMIT = 15;

interface Blog {
  id: number;
  title: string;
  featured_image?: string | null;
  published_at?: string | null;
  is_active: boolean;
  // Category is optional — a blog can exist without one
  blog_category?: { id: number; name: string } | null;
}

const inputStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  color: "#101d30",
};

const COLUMNS = ["", "Title", "Category", "Published", "Status", ""];

export default function Blogs() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await GetBlogsAPI({ token });
      if (res.data?.success) {
        // API returns a flat array (data.data), not a { rows, total } wrapper —
        // handling both shapes defensively in case pagination gets added server-side later
        const list = Array.isArray(res.data.data) ? res.data.data : res.data.data?.rows || [];
        setBlogs(list);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load blogs",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      const res = await DeleteBlogAPI(id, token);
      if (res.data?.success) {
        toast({ title: "Blog deleted" });
        fetchBlogs();
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

  // Client-side search + pagination — swap for server-side params once/if the
  // blog endpoint supports them
  const filtered = useMemo(
    () => blogs.filter((b) => b.title.toLowerCase().includes(search.toLowerCase())),
    [blogs, search]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-semibold" style={{ color: "#101d30" }}>
            <Newspaper className="h-5 w-5" style={{ color: "#c9a227" }} />
            Blog
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
            Manage articles published on the Marco Passport.
          </p>
        </div>

        <button
          onClick={() => navigate("/blogs/add")}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 flex-shrink-0"
          style={{ background: "#E4CE8F", color: "#101d30" }}
        >
          <Plus className="h-4 w-4" />
          Add blog
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
              placeholder="Search blogs..."
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
                {COLUMNS.map((h, i) => (
                  <th
                    key={i}
                    className={`text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wider ${
                      i === 0 ? "w-[76px]" : ""
                    }`}
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
                  <td colSpan={COLUMNS.length} className="px-5 py-14 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: "#9aa3b2" }} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-5 py-14 text-center text-sm" style={{ color: "#9aa3b2" }}>
                    No blogs found.
                  </td>
                </tr>
              ) : (
                paginated.map((blog, idx) => (
                  <tr key={blog.id} style={{ background: idx % 2 === 1 ? "#fafbfc" : "#ffffff" }}>
                    <td className="px-5 py-3">
                      {/* 16:9 thumb to match the featured-image crop ratio */}
                      <div
                        className="h-9 w-16 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0"
                        style={{ background: "#f2f3f6", border: "1px solid #e8eaef" }}
                      >
                        {blog.featured_image ? (
                          <img
                            src={`${IMAGE_BASE_URL}${blog.featured_image}`}
                            alt={blog.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Newspaper className="h-4 w-4" style={{ color: "#c2c7d1" }} />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium max-w-[380px] truncate" style={{ color: "#101d30" }}>
                      {blog.title}
                    </td>
                    <td className="px-5 py-3">
                      {blog.blog_category?.name ? (
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
                          style={{ background: "#f2f3f6", color: "#101d30" }}
                        >
                          {blog.blog_category.name}
                        </span>
                      ) : (
                        <span className="text-[13px]" style={{ color: "#b4bac6" }}>
                          Uncategorized
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: "#6b7688" }}>
                      {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={
                          blog.is_active
                            ? { background: "#fbf3de", color: "#a3874f" }
                            : { background: "#f1f2f5", color: "#8993a6" }
                        }
                      >
                        {blog.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/blogs/${blog.id}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "#8993a6" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f3f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/blogs/${blog.id}/edit`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "#8993a6" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f3f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: blog.id, title: blog.title })}
                          disabled={deletingId === blog.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: "#c25b4a" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#fbeceb")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="Delete"
                        >
                          {deletingId === blog.id ? (
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
              Delete blog?
            </h3>
            <p className="text-sm mt-1.5" style={{ color: "#6b7688" }}>
              This will permanently remove{" "}
              <span style={{ color: "#101d30", fontWeight: 500 }}>"{deleteTarget.title}"</span>. This can't be undone.
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