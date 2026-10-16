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
  MapPin,
  ZoomIn,
  Crop as CropIcon,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  GetPlaceCategoriesAPI,
  AddPlaceCategoryAPI,
  UpdatePlaceCategoryAPI,
  DeletePlaceCategoryAPI,
} from "@/services/Api/PlacesApi";
import { cn } from "@/lib/utils";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/webp", "image/png"];

// ↓↓↓ Only place to change the category-image crop ratio. ↓↓↓
const CATEGORY_IMAGE_RATIO_W = 16;
const CATEGORY_IMAGE_RATIO_H = 9;
const CATEGORY_IMAGE_ASPECT = CATEGORY_IMAGE_RATIO_W / CATEGORY_IMAGE_RATIO_H;
const CATEGORY_IMAGE_ASPECT_CSS = `${CATEGORY_IMAGE_RATIO_W}/${CATEGORY_IMAGE_RATIO_H}`;
const CATEGORY_IMAGE_RATIO_LABEL = `${CATEGORY_IMAGE_RATIO_W}:${CATEGORY_IMAGE_RATIO_H}`;

interface PlaceCategory {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  is_active: boolean;
}

const labelClass = "text-[11px] leading-6 tracking-wider uppercase text-ink-subtle";

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

export default function PlaceCategories() {
  const { toast } = useToast();

  const [categories, setCategories] = useState<PlaceCategory[]>([]);
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

  // Crop step state (lives inside the same modal, just a different view)
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
      const res = await GetPlaceCategoriesAPI(token);
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

  const openEditModal = (cat: PlaceCategory) => {
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
      if (formImageFile) formData.append("images", formImageFile);

      const res =
        modalMode === "edit" && editingId
          ? await UpdatePlaceCategoryAPI(editingId, formData, token)
          : await AddPlaceCategoryAPI(formData, token);

      if (res.data?.success) {
        toast({ title: modalMode === "edit" ? "Category updated" : "Category added" });
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
      const res = await DeletePlaceCategoryAPI(id, token);
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

  const modalImageSrc = formImagePreview || (existingImagePath ? `${IMAGE_BASE_URL}${existingImagePath}` : null);

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-semibold text-navy">
            <Tags className="h-5 w-5 text-gold" />
            Place Categories
          </h1>
          <p className="text-sm mt-1 text-ink-muted">
            Categories for Places to Visit — beaches, nature, culture, and more.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 shrink-0 bg-gold-light text-navy"
        >
          <Plus className="h-4 w-4" />
          Add category
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white border border-line shadow-card">
        <div className="px-5 py-4 border-b border-line-soft">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <Input
              placeholder="Search categories..."
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
                {["", "Name", "Slug", "Status", ""].map((h, i) => (
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-sm text-ink-faint">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="bg-white even:bg-surface-subtle">
                    <td className="px-5 py-3">
                      {cat.image ? (
                        <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 bg-fill">
                          <img src={`${IMAGE_BASE_URL}${cat.image}`} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-fill"
                        >
                          <MapPin className="h-4 w-4 text-ink-ghost" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-navy">
                      {cat.name}
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
                        <button
                          onClick={() => openEditModal(cat)}
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
          className="fixed inset-0 flex items-center justify-center px-4 bg-navy/50 z-[100000]"
          onClick={() => !submitting && modalStep === "form" && closeModal()}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden bg-white shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {modalStep === "form" ? (
              <>
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-navy">
                    {modalMode === "edit" ? "Edit category" : "Add category"}
                  </h3>
                  <button onClick={closeModal} className="text-ink-faint">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                  <div className="flex justify-center">
                    <label
                      className={cn("relative rounded-lg cursor-pointer overflow-hidden w-[160px]", modalImageSrc ? "bg-transparent" : "bg-surface-muted", modalImageSrc ? "border border-line" : "border border-dashed border-line-strong")}
                      style={{ aspectRatio: CATEGORY_IMAGE_ASPECT_CSS }}
                    >
                      {modalImageSrc ? (
                        <img src={modalImageSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                          <ImagePlus className="h-5 w-5 text-ink-faint" />
                          <span className="text-xs text-ink-faint">
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
                  <p className="text-center text-[11px] flex items-center justify-center gap-1 text-ink-ghost">
                    <CropIcon className="h-3 w-3" />
                    {CATEGORY_IMAGE_RATIO_LABEL} · optional · tap image to change
                  </p>

                  <div className="space-y-1.5">
                    <Label className={labelClass}>
                      Name <span className="text-gold">*</span>
                    </Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      placeholder="e.g. Beach"
                      autoFocus
                      className="h-10 rounded-lg text-[14px]"
                    />
                  </div>
                </div>

                <div className="px-6 pb-6 flex items-center gap-2">
                  <button
                    onClick={closeModal}
                    disabled={submitting}
                    className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50 bg-fill text-navy"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={submitting || !formName.trim()}
                    className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 bg-gold-light text-navy"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {submitting ? "Saving..." : modalMode === "edit" ? "Save changes" : "Add category"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 pt-6 pb-4">
                  <h3 className="text-[16px] font-semibold flex items-center gap-2 text-navy">
                    <CropIcon className="h-4 w-4 text-gold" />
                    Crop image
                  </h3>
                  <p className="text-sm mt-1 text-ink-muted">
                    Drag to reposition, use the slider to zoom. Locked at {CATEGORY_IMAGE_RATIO_LABEL}.
                  </p>
                </div>

                <div className="relative w-full h-[300px] bg-navy">
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
                  <ZoomIn className="h-4 w-4 shrink-0 text-ink-faint" />
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
                    className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50 bg-fill text-navy"
                  >
                    Back
                  </button>
                  <button
                    onClick={applyCrop}
                    disabled={cropping || !croppedAreaPixels}
                    className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 bg-gold-light text-navy"
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