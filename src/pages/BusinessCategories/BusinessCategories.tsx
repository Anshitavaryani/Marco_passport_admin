/** @format */
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Cropper, { type Area } from "react-easy-crop";
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  AlertTriangle,
  ImagePlus,
  Building2,
  ZoomIn,
  Crop as CropIcon,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  GetBusinessCategoriesAPI,
  AddBusinessCategoryAPI,
  UpdateBusinessCategoryAPI,
  DeleteBusinessCategoryAPI,
} from "@/services/Api/BusinessApi";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/webp", "image/png"];

// ↓↓↓ Only place to change the category-image crop ratio. Same values as
// PlaceCategories.tsx, kept as a separate constant per-file on purpose so
// business and place categories could diverge later without touching both. ↓↓↓
const CATEGORY_IMAGE_RATIO_W = 16;
const CATEGORY_IMAGE_RATIO_H = 9;
const CATEGORY_IMAGE_ASPECT = CATEGORY_IMAGE_RATIO_W / CATEGORY_IMAGE_RATIO_H;
const CATEGORY_IMAGE_ASPECT_CSS = `${CATEGORY_IMAGE_RATIO_W}/${CATEGORY_IMAGE_RATIO_H}`;
const CATEGORY_IMAGE_RATIO_LABEL = `${CATEGORY_IMAGE_RATIO_W}:${CATEGORY_IMAGE_RATIO_H}`;

interface BusinessCategory {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  type: "business";
  is_active: boolean;
}

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
const labelClass = "text-[11px] tracking-wider uppercase";
const labelStyle = { color: "#8993a6" };

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.crossOrigin = "anonymous";
    img.src = url;
  });

const getCroppedImageFile = async (
  imageSrc: string,
  croppedAreaPixels: Area,
  fileName: string,
  mimeType: string
): Promise<File> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to crop image"));
        return;
      }
      resolve(new File([blob], fileName, { type: mimeType }));
    }, mimeType);
  });
};

export default function BusinessCategories() {
  const { toast } = useToast();

  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // --- The one modal: handles both add and edit ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalStep, setModalStep] = useState<"form" | "crop">("form");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Crop step state (same modal, different view)
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [rawImageMeta, setRawImageMeta] = useState<{ name: string; type: string } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropping, setCropping] = useState(false);

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
      const res = await GetBusinessCategoriesAPI(token);
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

  // --- Opening the modal ---
  const openAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFormName("");
    setFormImageFile(null);
    setFormImagePreview(null);
    setExistingImagePath(null);
    setModalStep("form");
    setModalOpen(true);
  };

  const openEditModal = (cat: BusinessCategory) => {
    setModalMode("edit");
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormImageFile(null);
    setFormImagePreview(null);
    setExistingImagePath(cat.image);
    setModalStep("form");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    if (formImagePreview) URL.revokeObjectURL(formImagePreview);
    setModalOpen(false);
    setModalStep("form");
    setRawImageSrc(null);
    setRawImageMeta(null);
    setCroppedAreaPixels(null);
  };

  // --- Picking a file switches the modal to its crop step ---
  const handlePickImage = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: "Unsupported file type", description: "Please use JPEG, JPG, WEBP, or PNG.", variant: "destructive" });
      return;
    }
    setRawImageSrc(URL.createObjectURL(file));
    setRawImageMeta({ name: file.name, type: file.type });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setModalStep("crop");
  };

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const cancelCrop = () => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
    setRawImageMeta(null);
    setCroppedAreaPixels(null);
    setModalStep("form");
  };

  const applyCrop = async () => {
    if (!rawImageSrc || !rawImageMeta || !croppedAreaPixels) return;
    try {
      setCropping(true);
      const croppedFile = await getCroppedImageFile(
        rawImageSrc,
        croppedAreaPixels,
        rawImageMeta.name,
        rawImageMeta.type
      );
      if (formImagePreview) URL.revokeObjectURL(formImagePreview);
      setFormImageFile(croppedFile);
      setFormImagePreview(URL.createObjectURL(croppedFile));
      setExistingImagePath(null);
      URL.revokeObjectURL(rawImageSrc);
      setRawImageSrc(null);
      setRawImageMeta(null);
      setCroppedAreaPixels(null);
      setModalStep("form");
    } catch (err) {
      toast({ title: "Failed to crop image", description: "Please try again.", variant: "destructive" });
    } finally {
      setCropping(false);
    }
  };

  // --- Save (add or edit) ---
  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", formName.trim());
      formData.append("type", "business");
      if (formImageFile) formData.append("images", formImageFile);

      const res =
        modalMode === "edit" && editingId
          ? await UpdateBusinessCategoryAPI(editingId, formData, token)
          : await AddBusinessCategoryAPI(formData, token);

      if (res.data?.success) {
        toast({ title: modalMode === "edit" ? "Business category updated" : "Business category added" });
        closeModal();
        fetchCategories();
      }
    } catch (err: any) {
      toast({
        title: modalMode === "edit" ? "Failed to update category" : "Failed to add category",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      const res = await DeleteBusinessCategoryAPI(id, token);
      if (res.data?.success) {
        toast({ title: "Business category deleted" });
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

  const filtered = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  const modalImageSrc = formImagePreview || (existingImagePath ? `${IMAGE_BASE_URL}${existingImagePath}` : null);

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-semibold" style={{ color: "#101d30" }}>
            <Tags className="h-5 w-5" style={{ color: "#c9a227" }} />
            Business Categories
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
            Categories for Business Directory listings — places to stay, eat, activities, shopping, and local services.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 flex-shrink-0"
          style={{ background: "#E4CE8F", color: "#101d30" }}
        >
          <Plus className="h-4 w-4" />
          Add category
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #edeff3" }}>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9aa3b2" }} />
            <Input
              placeholder="Search business categories..."
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
                {["", "Name", "Slug", "Status", ""].map((heading, index) => (
                  <th
                    key={index}
                    className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wider"
                    style={{ color: "#8993a6" }}
                  >
                    {heading}
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-sm" style={{ color: "#9aa3b2" }}>
                    No business categories found.
                  </td>
                </tr>
              ) : (
                filtered.map((cat, index) => (
                  <tr key={cat.id} style={{ background: index % 2 === 1 ? "#fafbfc" : "#ffffff" }}>
                    <td className="px-5 py-3">
                      {cat.image ? (
                        <div className="h-9 w-9 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#f2f3f6" }}>
                          <img src={`${IMAGE_BASE_URL}${cat.image}`} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "#f2f3f6" }}
                        >
                          <Building2 className="h-4 w-4" style={{ color: "#c2c7d1" }} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: "#101d30" }}>
                      {cat.name}
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
                        <button
                          onClick={() => openEditModal(cat)}
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal — one modal, two internal steps (form → crop → back to form) */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ background: "rgba(16,29,48,0.5)", zIndex: 100000 }}
          onClick={() => !submitting && modalStep === "form" && closeModal()}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#ffffff", boxShadow: "0 24px 60px -16px rgba(16,29,48,0.4)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {modalStep === "form" ? (
              <>
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold" style={{ color: "#101d30" }}>
                    {modalMode === "edit" ? "Edit category" : "Add category"}
                  </h3>
                  <button onClick={closeModal} style={{ color: "#9aa3b2" }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div className="flex justify-center">
                    <label
                      className="relative rounded-lg cursor-pointer overflow-hidden"
                      style={{
                        width: 160,
                        aspectRatio: CATEGORY_IMAGE_ASPECT_CSS,
                        background: modalImageSrc ? "transparent" : "#f8f9fb",
                        border: modalImageSrc ? "1px solid #e2e5eb" : "1px dashed #d5d9e0",
                      }}
                    >
                      {modalImageSrc ? (
                        <img src={modalImageSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                          <ImagePlus className="h-5 w-5" style={{ color: "#9aa3b2" }} />
                          <span className="text-xs" style={{ color: "#9aa3b2" }}>
                            Tap to add image
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/webp,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePickImage(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-center text-[11px] flex items-center justify-center gap-1" style={{ color: "#c2c7d1" }}>
                    <CropIcon className="h-3 w-3" />
                    {CATEGORY_IMAGE_RATIO_LABEL} · optional · tap image to change
                  </p>

                  <div className="space-y-1.5">
                    <Label className={labelClass} style={labelStyle}>
                      Name <span style={{ color: "#c9a227" }}>*</span>
                    </Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      placeholder="e.g. Places to Stay"
                      autoFocus
                      className="h-10 rounded-lg text-[14px]"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="px-6 pb-6 flex items-center gap-2">
                  <button
                    onClick={closeModal}
                    disabled={submitting}
                    className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: "#f2f3f6", color: "#101d30" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={submitting || !formName.trim()}
                    className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "#E4CE8F", color: "#101d30" }}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {submitting ? "Saving..." : modalMode === "edit" ? "Save changes" : "Add category"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 pt-6 pb-4">
                  <h3 className="text-[16px] font-semibold flex items-center gap-2" style={{ color: "#101d30" }}>
                    <CropIcon className="h-4 w-4" style={{ color: "#c9a227" }} />
                    Crop image
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
                    Drag to reposition, use the slider to zoom. Locked at {CATEGORY_IMAGE_RATIO_LABEL}.
                  </p>
                </div>

                <div className="relative w-full" style={{ height: 300, background: "#101d30" }}>
                  {rawImageSrc && (
                    <Cropper
                      image={rawImageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={CATEGORY_IMAGE_ASPECT}
                      cropShape="rect"
                      showGrid
                      restrictPosition
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  )}
                </div>

                <div className="px-6 py-4 flex items-center gap-3">
                  <ZoomIn className="h-4 w-4 flex-shrink-0" style={{ color: "#9aa3b2" }} />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>

                <div className="px-6 pb-6 flex items-center gap-2">
                  <button
                    onClick={cancelCrop}
                    disabled={cropping}
                    className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ background: "#f2f3f6", color: "#101d30" }}
                  >
                    Back
                  </button>
                  <button
                    onClick={applyCrop}
                    disabled={cropping || !croppedAreaPixels}
                    className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "#E4CE8F", color: "#101d30" }}
                  >
                    {cropping ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {cropping ? "Applying..." : "Apply crop"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
              Delete business category?
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
                onClick={() => handleDelete(deleteTarget.id)}
                disabled={deletingId !== null}
                className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: "#c25b4a", color: "#ffffff" }}
              >
                {deletingId !== null && <Loader2 className="h-4 w-4 animate-spin" />}
                {deletingId !== null ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}