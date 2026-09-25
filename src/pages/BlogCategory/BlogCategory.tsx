/** @format */
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Pencil, Trash2, Loader2, Check, X, Search, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  GetBlogCategoriesAPI,
  AddBlogCategoryAPI,
  UpdateBlogCategoryAPI,
  DeleteBlogCategoryAPI,
} from "@/services/Api/BlogCategoryApi";

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

const inputStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  color: "#101d30",
};

export default function BlogCategories() {
  const { toast } = useToast();

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await GetBlogCategoriesAPI(token);
      if (res.data?.success) {
        setCategories(res.data?.data || []);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load categories",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setAdding(true);
      const res = await AddBlogCategoryAPI({ name: newName.trim() }, token);
      if (res.data?.success) {
        toast({ title: "Category added" });
        setNewName("");
        fetchCategories();
      }
    } catch (err: any) {
      toast({
        title: "Failed to add category",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (cat: BlogCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) return;
    try {
      setSaving(true);
      const res = await UpdateBlogCategoryAPI(id, { name: editName.trim() }, token);
      if (res.data?.success) {
        toast({ title: "Category updated" });
        cancelEdit();
        fetchCategories();
      }
    } catch (err: any) {
      toast({
        title: "Failed to update category",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      setDeletingId(id);
      const res = await DeleteBlogCategoryAPI(id, token);
      if (res.data?.success) {
        toast({ title: "Category deleted" });
        fetchCategories();
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

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-[20px] font-semibold" style={{ color: "#101d30" }}>
          <Tag className="h-5 w-5" style={{ color: "#c9a227" }} />
          Blog Categories
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
          Organize blog posts into categories.
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #e2e5eb", boxShadow: "0 1px 3px rgba(16,29,48,0.06)" }}
      >
        <div className="px-5 py-4 flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid #edeff3" }}>
          <div className="relative max-w-xs flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9aa3b2" }} />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 text-[13.5px]"
              style={inputStyle}
            />
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Input
              placeholder="New category name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="h-9 rounded-lg text-[13.5px] flex-1"
              style={inputStyle}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
              style={{ background: "#E4CE8F", color: "#101d30" }}
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #edeff3" }}>
                {["Name", "Slug", "Status", ""].map((h, i) => (
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
                  <td colSpan={4} className="px-5 py-14 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: "#9aa3b2" }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center text-sm" style={{ color: "#9aa3b2" }}>
                    No categories found.
                  </td>
                </tr>
              ) : (
                filtered.map((cat, idx) => (
                  <tr key={cat.id} style={{ background: idx % 2 === 1 ? "#fafbfc" : "#ffffff" }}>
                    <td className="px-5 py-3 font-medium" style={{ color: "#101d30" }}>
                      {editingId === cat.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)}
                          autoFocus
                          className="h-8 rounded-lg text-[13.5px] max-w-[220px]"
                          style={inputStyle}
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      {cat.slug}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={
                          cat.is_active
                            ? { background: "#fbf3de", color: "#a3874f" }
                            : { background: "#f1f2f5", color: "#8993a6" }
                        }
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === cat.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(cat.id)}
                              disabled={saving}
                              className="h-8 w-8 flex items-center justify-center rounded-lg"
                              style={{ color: "#3f9d5c" }}
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="h-8 w-8 flex items-center justify-center rounded-lg"
                              style={{ color: "#8993a6" }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(cat)}
                              className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                              style={{ color: "#8993a6" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f3f6")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                              disabled={deletingId === cat.id}
                              className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                              style={{ color: "#c25b4a" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#fbeceb")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              title="Delete"
                            >
                              {deletingId === cat.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              Delete category?
            </h3>
            <p className="text-sm mt-1.5" style={{ color: "#6b7688" }}>
              This will permanently remove <span style={{ color: "#101d30", fontWeight: 500 }}>"{deleteTarget.name}"</span>. This can't be undone.
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