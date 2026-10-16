/** @format */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { Editor } from "@tinymce/tinymce-react";
import Cropper, { type Area } from "react-easy-crop";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Loader2,
  Star,
  Calendar,
  Clock,
  ZoomIn,
  Crop as CropIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EDITOR_STYLE_FORMATS, editorContentStyle } from "@/lib/editor";
import {
  AddBlogAPI,
  UpdateBlogAPI,
  GetBlogByIdAPI,
} from "@/services/Api/BlogApi";
import { GetBlogCategoriesAPI } from "@/services/Api/BlogCategoryApi";
import { cn } from "@/lib/utils";

const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/png",
];

// ↓↓↓ Only place to change the featured-image crop ratio. ↓↓↓
const FEATURED_IMAGE_RATIO_W = 16;
const FEATURED_IMAGE_RATIO_H = 9;
// ↑↑↑ change only these two numbers to test a different ratio ↑↑↑

const FEATURED_IMAGE_ASPECT = FEATURED_IMAGE_RATIO_W / FEATURED_IMAGE_RATIO_H;
const FEATURED_IMAGE_ASPECT_CSS = `${FEATURED_IMAGE_RATIO_W}/${FEATURED_IMAGE_RATIO_H}`;
const FEATURED_IMAGE_RATIO_LABEL = `${FEATURED_IMAGE_RATIO_W}:${FEATURED_IMAGE_RATIO_H}`;

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
  mimeType: string,
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
    croppedAreaPixels.height,
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

const labelClass = "text-[11px] leading-6 tracking-wider uppercase text-ink-subtle";

interface Category {
  id: number;
  name: string;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// Splits a Date into the pieces the custom 12-hour picker below needs —
// separate from the native datetime-local approach specifically so the
// displayed hour/AM-PM never depends on the browser/OS locale.
const splitDateTime = (d: Date) => {
  const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  let hour12 = d.getHours() % 12;
  if (hour12 === 0) hour12 = 12;
  const ampm: "AM" | "PM" = d.getHours() >= 12 ? "PM" : "AM";
  // Rounds to the nearest quarter-hour — published time doesn't need
  // minute-level precision.
  const minute = (Math.round(d.getMinutes() / 15) * 15) % 60;
  return { dateStr, hour12, minute, ampm };
};

// Content images are constrained to this ratio via CSS (object-fit:
// cover), not physically cropped before upload.
const CONTENT_IMAGE_ASPECT_RATIO = "16 / 9";

export default function BlogForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Optional — "" means no category
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Custom 12-hour published-at picker state
  const initialSplit = splitDateTime(new Date());
  const [publishedDate, setPublishedDate] = useState(initialSplit.dateStr);
  const [publishedHour12, setPublishedHour12] = useState(initialSplit.hour12);
  const [publishedMinute, setPublishedMinute] = useState(initialSplit.minute);
  const [publishedAmPm, setPublishedAmPm] = useState<"AM" | "PM">(
    initialSplit.ampm,
  );

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState<string | null>(
    null,
  );

  // Crop modal — featured image only.
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [rawImageMeta, setRawImageMeta] = useState<{
    name: string;
    type: string;
  } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropping, setCropping] = useState(false);

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchBlog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await GetBlogCategoriesAPI(token);
      if (res.data?.success) setCategories(res.data?.data || []);
    } catch (err) {
      // non-blocking
    }
  };

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const res = await GetBlogByIdAPI(id as string, token);
      if (res.data?.success) {
        const b = res.data.data;
        // null category → "" so the select shows "No category"
        const catId = b.category_id ?? b.blog_category?.id;
        setCategoryId(catId != null ? String(catId) : "");
        setTitle(b.title || "");
        setDescription(b.description || "");
        setContent(b.content || "");
        setIsFeatured(!!b.is_featured);
        if (b.published_at) {
          const split = splitDateTime(new Date(b.published_at));
          setPublishedDate(split.dateStr);
          setPublishedHour12(split.hour12);
          setPublishedMinute(split.minute);
          setPublishedAmPm(split.ampm);
        }
        setExistingImagePath(b.featured_image || null);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load blog",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturedImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please use JPEG, JPG, WEBP, or PNG.",
        variant: "destructive",
      });
      return;
    }
    setRawImageSrc(URL.createObjectURL(file));
    setRawImageMeta({ name: file.name, type: file.type });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropModalOpen(true);
    e.target.value = "";
  };

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixelsValue: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsValue);
    },
    [],
  );

  const closeCropModal = () => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setCropModalOpen(false);
    setRawImageSrc(null);
    setRawImageMeta(null);
    setCroppedAreaPixels(null);
  };

  const handleConfirmCrop = async () => {
    if (!rawImageSrc || !rawImageMeta || !croppedAreaPixels) return;
    try {
      setCropping(true);
      const croppedFile = await getCroppedImageFile(
        rawImageSrc,
        croppedAreaPixels,
        rawImageMeta.name,
        rawImageMeta.type,
      );
      setFeaturedImage(croppedFile);
      setFeaturedPreview(URL.createObjectURL(croppedFile));
      setExistingImagePath(null);
      closeCropModal();
    } catch (err) {
      toast({
        title: "Failed to crop image",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCropping(false);
    }
  };

  const handleEditorImageUpload = (blobInfo: any): Promise<string> =>
    new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("images", blobInfo.blob(), blobInfo.filename());

      fetch(`${IMAGE_BASE_URL}/api/v1/blog/upload-image`, {
        method: "POST",
        headers: {
          "x-access-token": token,
        },
        body: formData,
      })
        .then((res) => res.json())
        .then((json) => {
          if (!json?.success || !json?.data?.url) {
            reject(json?.message || "Image upload failed.");
            return;
          }
          resolve(`${IMAGE_BASE_URL}${json.data.url}`);
        })
        .catch(() => reject("Image upload failed. Please try again."));
    });

  const getPublishedAtDate = (): Date | null => {
    if (!publishedDate) return null;
    const [y, m, d] = publishedDate.split("-").map(Number);
    let hour24 = publishedHour12 % 12;
    if (publishedAmPm === "PM") hour24 += 12;
    return new Date(y, m - 1, d, hour24, publishedMinute, 0, 0);
  };

  const handleSubmit = async () => {
    // Category is intentionally NOT required
    if (!title.trim() || !description.trim() || !content.trim()) {
      toast({
        title: "Missing required fields",
        description: "Title, description, and content are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      // Optional category:
      //  - selected → send the id
      //  - none on create → omit the field entirely
      //  - cleared on edit → send "" so the backend sets category_id = NULL
      if (categoryId) {
        formData.append("category_id", categoryId);
      } else if (isEdit) {
        formData.append("category_id", "");
      }

      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("content", content.trim());
      formData.append("is_featured", String(isFeatured));
      const publishedAtDate = getPublishedAtDate();
      if (publishedAtDate)
        formData.append("published_at", publishedAtDate.toISOString());
      // field name is "images" per the multer config, even though it maps to featured_image in the DB
      if (featuredImage) formData.append("images", featuredImage);

      const res = isEdit
        ? await UpdateBlogAPI(id as string, formData, token)
        : await AddBlogAPI(formData, token);

      if (res.data?.success) {
        toast({ title: isEdit ? "Blog updated" : "Blog created" });
        navigate("/blogs");
      }
    } catch (err: any) {
      toast({
        title: isEdit ? "Failed to update blog" : "Failed to create blog",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-16 flex justify-center">
        <Loader2
          className="h-5 w-5 animate-spin text-ink-faint"
        />
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <button
        onClick={() => navigate("/blogs")}
        className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity text-ink-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to blogs
      </button>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1
            className="text-[20px] font-semibold text-navy"
          >
            {isEdit ? "Edit blog" : "Add blog"}
          </h1>
          <p className="text-sm mt-1 text-ink-muted">
            {isEdit
              ? "Update this article."
              : "Write a new article for the Marco Passport."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="h-10 px-5 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 disabled:opacity-60 bg-gold-light text-navy"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create blog"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl p-6 md:p-8 space-y-5 bg-white border border-line shadow-card">
          <h2
            className="text-[13px] font-semibold uppercase tracking-wider text-ink-subtle"
          >
            Content
          </h2>

          <div className="space-y-1.5">
            <Label className={labelClass}>
              Title <span className="text-gold">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A First-Timer's Guide to Marco Island"
              className="h-10 rounded-lg text-[14px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>
              Description <span className="text-gold">*</span>
            </Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One or two sentences shown in previews and cards"
              rows={2}
              className="w-full rounded-lg text-[14px] px-3 py-2.5 outline-hidden resize-none bg-white border border-line text-navy"
            />
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass}>
              Content <span className="text-gold">*</span>
            </Label>
            <div
              className="rounded-lg overflow-hidden border border-line"
            >
              <Editor
                tinymceScriptSrc="/tinymce/tinymce.min.js"
                licenseKey="gpl"
                value={content}
                onEditorChange={(newContent) => setContent(newContent)}
                init={{
                  height: 640,
                  menubar: false,
                  plugins: [
                    "advlist",
                    "autolink",
                    "lists",
                    "link",
                    "image",
                    "charmap",
                    "preview",
                    "searchreplace",
                    "visualblocks",
                    "code",
                    "fullscreen",
                    "media",
                    "table",
                    "wordcount",
                  ],
                  toolbar:
                    "undo redo | styles | bold italic | " +
                    "alignleft aligncenter alignright | " +
                    "bullist numlist outdent indent | " +
                    "link image media | blockquote | code fullscreen",
                  style_formats: EDITOR_STYLE_FORMATS,
                  style_formats_merge: true,
                  content_style: editorContentStyle(CONTENT_IMAGE_ASPECT_RATIO),
                  images_upload_handler: handleEditorImageUpload,
                  automatic_uploads: true,
                  file_picker_types: "image",
                }}
              />
            </div>
            <p className="text-[11px] text-ink-ghost">
              Drop or paste images directly into the article — they upload
              automatically and display at a consistent 16:9 ratio to match the
              rest of the site. Use the "Styles" dropdown for headings, Insider
              Tip callouts, and Pull Quotes.
            </p>
          </div>
        </div>

        {/* Featured image + Details side by side on large screens */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] items-start">
          <div className="rounded-2xl p-6 md:p-8 space-y-3 bg-white border border-line shadow-card">
            <h2
              className="text-[13px] font-semibold uppercase tracking-wider text-ink-subtle"
            >
              Featured image
            </h2>
            {featuredPreview || existingImagePath ? (
              <div
                className="relative w-full rounded-lg overflow-hidden bg-white border border-line shadow-card"
                style={{ aspectRatio: FEATURED_IMAGE_ASPECT_CSS }}
              >
                <img
                  src={featuredPreview || `${IMAGE_BASE_URL}${existingImagePath}`}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setFeaturedImage(null);
                    setFeaturedPreview(null);
                    setExistingImagePath(null);
                  }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center bg-navy/70 text-white"
                  title="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center gap-1.5 w-full rounded-lg cursor-pointer bg-surface-muted border border-dashed border-line-strong"
                style={{ aspectRatio: FEATURED_IMAGE_ASPECT_CSS }}
              >
                <ImagePlus className="h-5 w-5 text-ink-faint" />
                <span className="text-xs text-ink-faint">
                  Upload image
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/webp,image/png"
                  className="hidden"
                  onChange={handleFeaturedImage}
                />
              </label>
            )}
            <p
              className="text-[11px] flex items-start gap-1 text-ink-ghost"
            >
              <CropIcon className="h-3 w-3 mt-0.5 shrink-0" />
              Cropped to a fixed {FEATURED_IMAGE_RATIO_LABEL} frame — you can
              reposition and zoom, not stretch it.
            </p>
          </div>

          <div className="rounded-2xl p-6 md:p-8 space-y-5 bg-white border border-line shadow-card">
            <h2
              className="text-[13px] font-semibold uppercase tracking-wider text-ink-subtle"
            >
              Details
            </h2>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  Category{" "}
                  <span
                    className="normal-case tracking-normal text-[11px] text-ink-faint"
                  >
                    (optional)
                  </span>
                </Label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={cn("w-full h-12 rounded-lg text-[14px] px-3.5 pr-9 outline-hidden cursor-pointer bg-white border border-line", categoryId ? "text-navy" : "text-ink-faint")}
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="text-navy">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {categoryId && (
                    <button
                      type="button"
                      onClick={() => setCategoryId("")}
                      className="absolute right-8 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center hover:opacity-70 bg-fill text-ink-subtle"
                      title="Clear category"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Custom 12-hour published-at picker — avoids the native
                  datetime-local widget, which can render in 24-hour
                  format depending on browser/OS locale. */}
              <div className="space-y-1.5">
                <Label className={labelClass}>
                  Published at
                </Label>
                <div
                  className="flex flex-wrap items-center gap-2.5 rounded-lg px-3.5 py-2 min-h-12 bg-white border border-line text-navy"
                >
                  <Calendar
                    className="h-4 w-4 shrink-0 text-ink-faint"
                  />
                  <input
                    type="date"
                    value={publishedDate}
                    onChange={(e) => setPublishedDate(e.target.value)}
                    className="bg-transparent text-[14px] outline-hidden text-navy"
                  />

                  <span
                    className="h-5 w-px shrink-0 bg-line"
                  />

                  <Clock
                    className="h-4 w-4 shrink-0 text-ink-faint"
                  />
                  <select
                    value={publishedHour12}
                    onChange={(e) => setPublishedHour12(Number(e.target.value))}
                    className="bg-transparent text-[14px] outline-hidden cursor-pointer text-navy"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        {pad2(h)}
                      </option>
                    ))}
                  </select>
                  <span className="text-ink-faint">:</span>
                  <select
                    value={publishedMinute}
                    onChange={(e) => setPublishedMinute(Number(e.target.value))}
                    className="bg-transparent text-[14px] outline-hidden cursor-pointer text-navy"
                  >
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={m}>
                        {pad2(m)}
                      </option>
                    ))}
                  </select>

                  <div
                    className="flex rounded-md overflow-hidden ml-auto shrink-0 border border-line"
                  >
                    {(["AM", "PM"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPublishedAmPm(p)}
                        className={cn("px-2.5 py-1 text-[12px] font-semibold transition-colors", publishedAmPm === p ? "bg-gold-light text-navy" : "bg-white text-ink-faint")}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured toggle — separated as its own row */}
            <div
              className="flex items-center justify-between gap-4 pt-4 border-t border-line-soft"
            >
              <div>
                <p
                  className="flex items-center gap-2 text-sm font-medium text-navy"
                >
                  <Star className="h-3.5 w-3.5 text-gold" />
                  Featured article
                </p>
                <p className="text-xs mt-0.5 text-ink-faint">
                  Highlight this article on the blog page.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isFeatured}
                onClick={() => setIsFeatured(!isFeatured)}
                className={cn("h-5 w-9 rounded-full relative transition-colors shrink-0", isFeatured ? "bg-gold-light" : "bg-line")}
              >
                <span
                  className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", isFeatured ? "left-4.5" : "left-0.5")}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crop modal — featured image only, fixed ratio */}
      {cropModalOpen && rawImageSrc && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4 bg-navy/60 z-[100000]"
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden bg-white shadow-modal"
          >
            <div className="px-6 pt-6 pb-4">
              <h3
                className="text-[16px] font-semibold flex items-center gap-2 text-navy"
              >
                <CropIcon className="h-4 w-4 text-gold" />
                Crop featured image
              </h3>
              <p className="text-sm mt-1 text-ink-muted">
                Drag to reposition, use the slider to zoom. The frame is locked
                at {FEATURED_IMAGE_RATIO_LABEL}.
              </p>
            </div>

            <div
              className="relative w-full h-[380px] bg-navy"
            >
              <Cropper
                image={rawImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={FEATURED_IMAGE_ASPECT}
                cropShape="rect"
                showGrid
                restrictPosition
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="px-6 py-4 flex items-center gap-3">
              <ZoomIn
                className="h-4 w-4 shrink-0 text-ink-faint"
              />
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
                onClick={closeCropModal}
                disabled={cropping}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50 bg-fill text-navy"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCrop}
                disabled={cropping || !croppedAreaPixels}
                className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 bg-gold-light text-navy"
              >
                {cropping ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {cropping ? "Applying..." : "Apply crop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}