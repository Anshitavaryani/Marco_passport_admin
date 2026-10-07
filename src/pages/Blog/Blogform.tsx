/** @format */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Trash2,
  AlertTriangle,
  ZoomIn,
  Crop as CropIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AddBlogAPI,
  UpdateBlogAPI,
  GetBlogByIdAPI,
  DeleteBlogAPI,
} from "@/services/Api/BlogApi";
import { GetBlogCategoriesAPI } from "@/services/Api/BlogCategoryApi";

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

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  boxShadow: "0 1px 3px rgba(16,29,48,0.06)",
};
const inputStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  color: "#101d30",
};
const labelClass = "text-[11px] tracking-wider uppercase";
const labelStyle = { color: "#8993a6" };

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

// Named styles an admin can apply from the editor's "Styles" dropdown.
// Adding a new visual treatment later is one more entry here plus one
// matching CSS rule below and on the live site.
const CUSTOM_STYLE_FORMATS = [
  {
    title: "Insider Tip",
    block: "div",
    classes: "insider-tip",
    wrapper: true,
  },
  {
    title: "Pull Quote",
    block: "blockquote",
    classes: "pull-quote",
    wrapper: true,
  },
];

// Content images are constrained to this ratio via CSS (object-fit:
// cover), not physically cropped before upload.
const CONTENT_IMAGE_ASPECT_RATIO = "16 / 9";

// Editor WYSIWYG preview only — keep in sync with article-content.css
// and the live frontend's article stylesheet.
const EDITOR_CONTENT_STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 15px; line-height: 1.6; color: #101d30; padding: 8px 12px; }
  body > p:first-of-type::first-letter { float: left; font-family: Georgia, "Times New Roman", serif; font-size: 64px; line-height: 0.85; font-weight: 600; padding: 4px 8px 0 0; color: #101d30; }
  .insider-tip { background: #FBF6E9; border-left: 3px solid #E4CE8F; border-radius: 8px; padding: 14px 16px; margin: 16px 0; }
  .insider-tip::before { content: "Insider tip"; display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #a3874f; margin-bottom: 4px; }
  blockquote.pull-quote { border-left: 3px solid #101d30; padding-left: 16px; margin: 20px 0; font-style: italic; font-size: 18px; color: #101d30; }
  blockquote:not(.pull-quote) { border-left: 3px solid #d5d9e0; padding-left: 16px; margin: 16px 0; color: #6b7688; }
  img { width: 100%; aspect-ratio: ${CONTENT_IMAGE_ASPECT_RATIO}; object-fit: cover; border-radius: 8px; margin: 16px 0; }
  figure.image { margin: 16px 0; }
  figure.image img { margin: 0; }
  figure.image figcaption { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #9aa3b2; text-align: center; margin-top: 8px; }
`;

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

  // Delete (edit mode only)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      const res = await DeleteBlogAPI(id, token);
      if (res.data?.success) {
        toast({ title: "Blog deleted" });
        navigate("/blogs");
      }
    } catch (err: any) {
      toast({
        title: "Failed to delete blog",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-16 flex justify-center">
        <Loader2
          className="h-5 w-5 animate-spin"
          style={{ color: "#9aa3b2" }}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <button
        onClick={() => navigate("/blogs")}
        className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity"
        style={{ color: "#6b7688" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to blogs
      </button>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1
            className="text-[20px] font-semibold"
            style={{ color: "#101d30" }}
          >
            {isEdit ? "Edit blog" : "Add blog"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
            {isEdit
              ? "Update this article."
              : "Write a new article for the Marco Passport."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* {isEdit && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2"
              style={{ background: "#fbeceb", color: "#c25b4a" }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )} */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="h-10 px-5 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 disabled:opacity-60"
            style={{ background: "#E4CE8F", color: "#101d30" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Saving..." : isEdit ? "Save changes" : "Create blog"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl p-6 md:p-8 space-y-5" style={cardStyle}>
          <h2
            className="text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: "#8993a6" }}
          >
            Content
          </h2>

          <div className="space-y-1.5">
            <Label className={labelClass} style={labelStyle}>
              Title <span style={{ color: "#c9a227" }}>*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A First-Timer's Guide to Marco Island"
              className="h-10 rounded-lg text-[14px]"
              style={inputStyle}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass} style={labelStyle}>
              Description <span style={{ color: "#c9a227" }}>*</span>
            </Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One or two sentences shown in previews and cards"
              rows={2}
              className="w-full rounded-lg text-[14px] px-3 py-2.5 outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={labelClass} style={labelStyle}>
              Content <span style={{ color: "#c9a227" }}>*</span>
            </Label>
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid #e2e5eb" }}
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
                  style_formats: CUSTOM_STYLE_FORMATS,
                  style_formats_merge: true,
                  content_style: EDITOR_CONTENT_STYLE,
                  images_upload_handler: handleEditorImageUpload,
                  automatic_uploads: true,
                  file_picker_types: "image",
                }}
              />
            </div>
            <p className="text-[11px]" style={{ color: "#c2c7d1" }}>
              Drop or paste images directly into the article — they upload
              automatically and display at a consistent 16:9 ratio to match the
              rest of the site. Use the "Styles" dropdown for headings, Insider
              Tip callouts, and Pull Quotes.
            </p>
          </div>
        </div>

        {/* Featured image + Details side by side on large screens */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] items-start">
          <div className="rounded-2xl p-6 md:p-8 space-y-3" style={cardStyle}>
            <h2
              className="text-[13px] font-semibold uppercase tracking-wider"
              style={{ color: "#8993a6" }}
            >
              Featured image
            </h2>
            {featuredPreview || existingImagePath ? (
              <div
                className="relative w-full rounded-lg overflow-hidden"
                style={{ ...cardStyle, aspectRatio: FEATURED_IMAGE_ASPECT_CSS }}
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
                  className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(16,29,48,0.7)", color: "#fff" }}
                  title="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center gap-1.5 w-full rounded-lg cursor-pointer"
                style={{
                  background: "#f8f9fb",
                  border: "1px dashed #d5d9e0",
                  aspectRatio: FEATURED_IMAGE_ASPECT_CSS,
                }}
              >
                <ImagePlus className="h-5 w-5" style={{ color: "#9aa3b2" }} />
                <span className="text-xs" style={{ color: "#9aa3b2" }}>
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
              className="text-[11px] flex items-start gap-1"
              style={{ color: "#c2c7d1" }}
            >
              <CropIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Cropped to a fixed {FEATURED_IMAGE_RATIO_LABEL} frame — you can
              reposition and zoom, not stretch it.
            </p>
          </div>

          <div className="rounded-2xl p-6 md:p-8 space-y-5" style={cardStyle}>
            <h2
              className="text-[13px] font-semibold uppercase tracking-wider"
              style={{ color: "#8993a6" }}
            >
              Details
            </h2>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={labelClass} style={labelStyle}>
                  Category{" "}
                  <span
                    className="normal-case tracking-normal text-[11px]"
                    style={{ color: "#b4bac6" }}
                  >
                    (optional)
                  </span>
                </Label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-12 rounded-lg text-[14px] px-3.5 pr-9 outline-none cursor-pointer"
                    style={{
                      ...inputStyle,
                      color: categoryId ? "#101d30" : "#9aa3b2",
                    }}
                  >
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} style={{ color: "#101d30" }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {categoryId && (
                    <button
                      type="button"
                      onClick={() => setCategoryId("")}
                      className="absolute right-8 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center hover:opacity-70"
                      style={{ background: "#f2f3f6", color: "#8993a6" }}
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
                <Label className={labelClass} style={labelStyle}>
                  Published at
                </Label>
                <div
                  className="flex flex-wrap items-center gap-2.5 rounded-lg px-3.5 py-2 min-h-12"
                  style={inputStyle}
                >
                  <Calendar
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: "#9aa3b2" }}
                  />
                  <input
                    type="date"
                    value={publishedDate}
                    onChange={(e) => setPublishedDate(e.target.value)}
                    className="bg-transparent text-[14px] outline-none"
                    style={{ color: "#101d30" }}
                  />

                  <span
                    className="h-5 w-px flex-shrink-0"
                    style={{ background: "#e2e5eb" }}
                  />

                  <Clock
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: "#9aa3b2" }}
                  />
                  <select
                    value={publishedHour12}
                    onChange={(e) => setPublishedHour12(Number(e.target.value))}
                    className="bg-transparent text-[14px] outline-none cursor-pointer"
                    style={{ color: "#101d30" }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        {pad2(h)}
                      </option>
                    ))}
                  </select>
                  <span style={{ color: "#9aa3b2" }}>:</span>
                  <select
                    value={publishedMinute}
                    onChange={(e) => setPublishedMinute(Number(e.target.value))}
                    className="bg-transparent text-[14px] outline-none cursor-pointer"
                    style={{ color: "#101d30" }}
                  >
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={m}>
                        {pad2(m)}
                      </option>
                    ))}
                  </select>

                  <div
                    className="flex rounded-md overflow-hidden ml-auto flex-shrink-0"
                    style={{ border: "1px solid #e2e5eb" }}
                  >
                    {(["AM", "PM"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPublishedAmPm(p)}
                        className="px-2.5 py-1 text-[12px] font-semibold transition-colors"
                        style={
                          publishedAmPm === p
                            ? { background: "#E4CE8F", color: "#101d30" }
                            : { background: "#ffffff", color: "#9aa3b2" }
                        }
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
              className="flex items-center justify-between gap-4 pt-4"
              style={{ borderTop: "1px solid #edeff3" }}
            >
              <div>
                <p
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "#101d30" }}
                >
                  <Star className="h-3.5 w-3.5" style={{ color: "#c9a227" }} />
                  Featured article
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#9aa3b2" }}>
                  Highlight this article on the blog page.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isFeatured}
                onClick={() => setIsFeatured(!isFeatured)}
                className="h-5 w-9 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: isFeatured ? "#E4CE8F" : "#e2e5eb" }}
              >
                <span
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                  style={{ left: isFeatured ? 18 : 2 }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crop modal — featured image only, fixed ratio */}
      {cropModalOpen && rawImageSrc && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ background: "rgba(16,29,48,0.6)", zIndex: 100000 }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              boxShadow: "0 24px 60px -16px rgba(16,29,48,0.4)",
            }}
          >
            <div className="px-6 pt-6 pb-4">
              <h3
                className="text-[16px] font-semibold flex items-center gap-2"
                style={{ color: "#101d30" }}
              >
                <CropIcon className="h-4 w-4" style={{ color: "#c9a227" }} />
                Crop featured image
              </h3>
              <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
                Drag to reposition, use the slider to zoom. The frame is locked
                at {FEATURED_IMAGE_RATIO_LABEL}.
              </p>
            </div>

            <div
              className="relative w-full"
              style={{ height: 380, background: "#101d30" }}
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
                className="h-4 w-4 flex-shrink-0"
                style={{ color: "#9aa3b2" }}
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
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: "#f2f3f6", color: "#101d30" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCrop}
                disabled={cropping || !croppedAreaPixels}
                className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "#E4CE8F", color: "#101d30" }}
              >
                {cropping ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {cropping ? "Applying..." : "Apply crop"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ background: "rgba(16,29,48,0.45)", zIndex: 100000 }}
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: "#ffffff",
              boxShadow: "0 24px 60px -16px rgba(16,29,48,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center mb-3"
              style={{ background: "#fbeceb" }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color: "#c25b4a" }} />
            </div>
            <h3
              className="text-[16px] font-semibold"
              style={{ color: "#101d30" }}
            >
              Delete blog?
            </h3>
            <p className="text-sm mt-1.5" style={{ color: "#6b7688" }}>
              This will permanently remove{" "}
              <span style={{ color: "#101d30", fontWeight: 500 }}>
                "{title || "this blog"}"
              </span>
              . This can't be undone.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: "#f2f3f6", color: "#101d30" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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