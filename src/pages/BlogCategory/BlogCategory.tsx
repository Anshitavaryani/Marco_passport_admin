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
import { cn } from "@/lib/utils";

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

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

  const handleDelete = async (id: number) => {
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
        <h1 className="flex items-center gap-2 text-[20px] font-semibold text-navy">
          <Tag className="h-5 w-5 text-gold" />
          Blog Categories
        </h1>
        <p className="text-sm mt-1 text-ink-muted">
          Organize blog posts into categories.
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden bg-white border border-line shadow-card"
      >
        <div className="px-5 py-4 flex items-center gap-3 flex-wrap border-b border-line-soft">
          <div className="relative max-w-xs flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 text-[13.5px]"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Input
              placeholder="New category name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="h-9 rounded-lg text-[13.5px] flex-1"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 shrink-0 bg-gold-light text-navy"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted border-b border-line-soft">
                {["Name", "Slug", "Status", ""].map((h, i) => (
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
                  <td colSpan={4} className="px-5 py-14 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-ink-faint" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-14 text-center text-sm text-ink-faint">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="bg-white even:bg-surface-subtle">
                    <td className="px-5 py-3 font-medium text-navy">
                      {editingId === cat.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)}
                          autoFocus
                          className="h-8 rounded-lg text-[13.5px] max-w-[220px]"
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {cat.slug}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium", cat.is_active ? "bg-gold-soft text-gold-dark" : "bg-fill text-ink-subtle")}
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
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-success"
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-subtle"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(cat)}
                              className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-ink-subtle hover:bg-fill"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                              disabled={deletingId === cat.id}
                              className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 text-danger hover:bg-danger-soft"
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
              Delete category?
            </h3>
            <p className="text-sm mt-1.5 text-ink-muted">
              This will permanently remove <span className="text-navy font-medium">"{deleteTarget.name}"</span>. This can't be undone.
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