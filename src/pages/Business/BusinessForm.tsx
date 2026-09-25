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
  Award,
  MapPinned,
  Trash2,
  AlertTriangle,
  ZoomIn,
  Crop as CropIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AddBusinessAPI,
  UpdateBusinessAPI,
  GetBusinessByIdAPI,
  GetBusinessCategoriesAPI,
} from "@/services/Api/BusinessApi";

const VALID_PRICE_LEVELS = ["$", "$$", "$$$", "$$$$"];
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";
const MAX_GALLERY_IMAGES = 10;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/png",
];

// ASSUMPTION — same guess as PlaceForm.tsx's current version, unconfirmed.
const BUSINESS_IMAGE_UPLOAD_ENDPOINT = `${IMAGE_BASE_URL}/api/v1/blog/upload-image`;

// ↓↓↓ Only place to change the crop ratio. Same value as Places: 16:9. ↓↓↓
const BUSINESS_IMAGE_RATIO_W = 16;
const BUSINESS_IMAGE_RATIO_H = 9;
const BUSINESS_IMAGE_ASPECT = BUSINESS_IMAGE_RATIO_W / BUSINESS_IMAGE_RATIO_H;
const BUSINESS_IMAGE_ASPECT_CSS = `${BUSINESS_IMAGE_RATIO_W}/${BUSINESS_IMAGE_RATIO_H}`;
const BUSINESS_IMAGE_RATIO_LABEL = `${BUSINESS_IMAGE_RATIO_W}:${BUSINESS_IMAGE_RATIO_H}`;

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

// Unified photo list — index 0 is "featured". Same reasoning as
// PlaceForm.tsx: this backend has no independent featured concept, it's
// literally whichever uploaded file arrives first (see buildImageFields
// on the server, shared by both places and businesses via the same
// underlying Place model/explore/admin route).
interface PhotoItem {
  key: string;
  file: File | null;
  existingPath: string | null;
  previewUrl: string;
}

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

// Re-hydrates an already-uploaded server image back into a real File —
// required because this backend rebuilds the ENTIRE gallery from
// whatever files arrive in a single request; there's no partial-update.
const urlToFile = async (url: string, filename: string): Promise<File> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
};

const CUSTOM_STYLE_FORMATS = [
  { title: "Insider Tip", block: "div", classes: "insider-tip", wrapper: true },
  {
    title: "Pull Quote",
    block: "blockquote",
    classes: "pull-quote",
    wrapper: true,
  },
];

const getAboutEditorContentStyle = () => `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 15px; line-height: 1.6; color: #101d30; padding: 8px 12px; }
  body > p:first-of-type::first-letter { float: left; font-family: Georgia, "Times New Roman", serif; font-size: 64px; line-height: 0.85; font-weight: 600; padding: 4px 8px 0 0; color: #101d30; }
  .insider-tip { background: #FBF6E9; border-left: 3px solid #E4CE8F; border-radius: 8px; padding: 14px 16px; margin: 16px 0; }
  .insider-tip::before { content: "Insider tip"; display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #a3874f; margin-bottom: 4px; }
  blockquote.pull-quote { border-left: 3px solid #101d30; padding-left: 16px; margin: 20px 0; font-style: italic; font-size: 18px; color: #101d30; }
  blockquote:not(.pull-quote) { border-left: 3px solid #d5d9e0; padding-left: 16px; margin: 16px 0; color: #6b7688; }
  img { width: 100%; aspect-ratio: ${BUSINESS_IMAGE_ASPECT_CSS}; object-fit: cover; border-radius: 8px; margin: 16px 0; }
  figure.image { margin: 16px 0; }
  figure.image img { margin: 0; }
  figure.image figcaption { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #9aa3b2; text-align: center; margin-top: 8px; }
`;

let photoKeyCounter = 0;
const nextPhotoKey = () => `photo-${++photoKeyCounter}-${Date.now()}`;

export default function BusinessForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [about, setAbout] = useState("");

  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState("");

  const [address, setAddress] = useState("");
  const [mapAddress, setMapAddress] = useState(""); // debounced copy of address, for the map embed only
  const [neighborhood, setNeighborhood] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [priceLevel, setPriceLevel] = useState("");

  // "Before you go" — hours + fees/parking/best_time_to_visit, same card
  // as PlaceForm.tsx's Practical info.
  const [hours, setHours] = useState("");
  const [fees, setFees] = useState("");
  const [parking, setParking] = useState("");
  const [bestTimeToVisit, setBestTimeToVisit] = useState("");

  const [isFeatured, setIsFeatured] = useState(false);
  const [isTopPick, setIsTopPick] = useState(false);
  const [topPickRank, setTopPickRank] = useState("");

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photosTouched, setPhotosTouched] = useState(false);

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
  const [addQueue, setAddQueue] = useState<File[]>([]);
  const [addQueueTotal, setAddQueueTotal] = useState(0);

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Debounces address into mapAddress purely so the map embed doesn't
  // reload on every keystroke — display-only, no API call involved.
  useEffect(() => {
    const timer = setTimeout(() => setMapAddress(address.trim()), 600);
    return () => clearTimeout(timer);
  }, [address]);

  const fetchCategories = async () => {
    try {
      const res = await GetBusinessCategoriesAPI(token);
      if (res.data?.success) setCategories(res.data?.data || []);
    } catch (err) {
      // non-blocking
    }
  };

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const res = await GetBusinessByIdAPI(id as string, token);
      if (res.data?.success) {
        const b = res.data.data;
        setName(b.name || "");
        setShortDescription(b.short_description || "");
        setAbout(b.about || "");

        const parseHighlights = (raw: any): string[] => {
          if (Array.isArray(raw)) return raw;

          if (typeof raw === "string" && raw.trim()) {
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }

          return [];
        };

        setHighlights(parseHighlights(b.highlights));

        setAddress(b.address || "");
        setNeighborhood(b.neighborhood || "");
        setPhone(b.phone || "");
        setEmail(b.email || "");
        setHours(b.hours || "");
        setFees(b.fees || "");
        setParking(b.parking || "");
        setBestTimeToVisit(b.best_time_to_visit || "");
        setWebsiteUrl(b.website_url || "");
        setPriceLevel(b.price_level || "");
        setIsFeatured(!!b.is_featured);
        setIsTopPick(!!b.is_top_pick);
        setTopPickRank(b.top_pick_rank ? String(b.top_pick_rank) : "");
        setSelectedCategoryIds((b.categories || []).map((c: any) => c.id));

        const existingPhotos: PhotoItem[] = [];
        if (b.featured_image) {
          existingPhotos.push({
            key: nextPhotoKey(),
            file: null,
            existingPath: b.featured_image,
            previewUrl: `${IMAGE_BASE_URL}${b.featured_image}`,
          });
        }
        if (Array.isArray(b.gallery_images)) {
          b.gallery_images
            .filter((path: string) => path !== b.featured_image)
            .forEach((path: string) => {
              existingPhotos.push({
                key: nextPhotoKey(),
                file: null,
                existingPath: path,
                previewUrl: `${IMAGE_BASE_URL}${path}`,
              });
            });
        }
        setPhotos(existingPhotos);
        setPhotosTouched(false);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load business",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addHighlight = () => {
    const trimmed = highlightInput.trim();
    if (!trimmed) return;

    setHighlights((prev) => [...prev, trimmed]);
    setHighlightInput("");
  };

  const removeHighlight = (idx: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId],
    );
  };

  // --- About editor: direct image upload, no crop step (matches Place) ---
  const handleAboutImageUpload = (blobInfo: any): Promise<string> =>
    new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("images", blobInfo.blob(), blobInfo.filename());

      fetch(BUSINESS_IMAGE_UPLOAD_ENDPOINT, {
        method: "POST",
        headers: { "x-access-token": token },
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

  const openCropForFile = (file: File) => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(URL.createObjectURL(file));
    setRawImageMeta({ name: file.name, type: file.type });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropModalOpen(true);
  };

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const closeCropModalFully = () => {
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setCropModalOpen(false);
    setRawImageSrc(null);
    setRawImageMeta(null);
    setCroppedAreaPixels(null);
    setAddQueue([]);
    setAddQueueTotal(0);
  };

  const advanceQueueOrClose = () => {
    const remaining = addQueue.slice(1);
    setAddQueue(remaining);
    if (remaining.length > 0) {
      openCropForFile(remaining[0]);
    } else {
      closeCropModalFully();
    }
  };

  const handleCropCancel = () => {
    if (addQueue.length > 0) {
      advanceQueueOrClose();
    } else {
      closeCropModalFully();
    }
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
      setPhotos((prev) => [
        ...prev,
        {
          key: nextPhotoKey(),
          file: croppedFile,
          existingPath: null,
          previewUrl: URL.createObjectURL(croppedFile),
        },
      ]);
      setPhotosTouched(true);
      advanceQueueOrClose();
    } catch (err) {
      toast({
        title: "Failed to crop image",
        description: "Please try again.",
        variant: "destructive",
      });
      closeCropModalFully();
    } finally {
      setCropping(false);
    }
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const invalid = files.filter((f) => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (invalid.length) {
      toast({
        title: "Unsupported file type",
        description: "Photos must be JPEG, JPG, WEBP, or PNG.",
        variant: "destructive",
      });
    }
    const validFiles = files.filter((f) =>
      ALLOWED_IMAGE_TYPES.includes(f.type),
    );

    const remainingSlots = MAX_GALLERY_IMAGES - photos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Photo limit reached",
        description: `You can have up to ${MAX_GALLERY_IMAGES} photos.`,
        variant: "destructive",
      });
      return;
    }
    if (validFiles.length > remainingSlots) {
      toast({
        title: "Too many photos",
        description: `Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} can be added (max ${MAX_GALLERY_IMAGES}).`,
        variant: "destructive",
      });
    }

    const toAdd = validFiles.slice(0, remainingSlots);
    if (!toAdd.length) return;

    setAddQueue(toAdd);
    setAddQueueTotal(toAdd.length);
    openCropForFile(toAdd[0]);
    e.target.value = "";
  };

  const removePhoto = (key: string) => {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
    setPhotosTouched(true);
  };

  const makeFeatured = (key: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.key === key);
      if (!target) return prev;
      return [target, ...prev.filter((p) => p.key !== key)];
    });
    setPhotosTouched(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !shortDescription.trim()) {
      toast({
        title: "Name and short description are required",
        variant: "destructive",
      });
      return;
    }
    if (priceLevel && !VALID_PRICE_LEVELS.includes(priceLevel)) {
      toast({ title: "Invalid price level", variant: "destructive" });
      return;
    }
    if (isTopPick && topPickRank && isNaN(Number(topPickRank))) {
      toast({
        title: "Top pick rank must be a number",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("type", "business");
      formData.append("name", name.trim());
      formData.append("short_description", shortDescription.trim());
      if (about.trim()) formData.append("about", about.trim());

      const cleanHighlights = highlights.map((h) => h.trim()).filter(Boolean);

      if (cleanHighlights.length) {
        formData.append("highlights", JSON.stringify(cleanHighlights));
      }

      if (address.trim()) formData.append("address", address.trim());
      if (neighborhood.trim())
        formData.append("neighborhood", neighborhood.trim());
      if (phone.trim()) formData.append("phone", phone.trim());
      if (email.trim()) formData.append("email", email.trim());
      if (hours.trim()) formData.append("hours", hours.trim());
      if (fees.trim()) formData.append("fees", fees.trim());
      if (parking.trim()) formData.append("parking", parking.trim());
      if (bestTimeToVisit.trim())
        formData.append("best_time_to_visit", bestTimeToVisit.trim());
      if (websiteUrl.trim()) formData.append("website_url", websiteUrl.trim());
      if (priceLevel) formData.append("price_level", priceLevel);
      formData.append("is_featured", String(isFeatured));
      formData.append("is_top_pick", String(isTopPick));
      if (isTopPick && topPickRank)
        formData.append("top_pick_rank", topPickRank);
      if (selectedCategoryIds.length)
        formData.append("category_ids", selectedCategoryIds.join(","));

      // Same backend contract as Places — see PlaceForm.tsx's comment.
      if (!photosTouched) {
        // no-op
      } else if (photos.length === 0) {
        formData.append("featured_image", "");
        formData.append("gallery_images", "");
      } else {
        const allFiles = await Promise.all(
          photos.map((p, i) =>
            p.file
              ? Promise.resolve(p.file)
              : urlToFile(p.previewUrl, `existing-${i}.jpg`),
          ),
        );
        allFiles.forEach((file) => formData.append("images", file));
      }

      const res = isEdit
        ? await UpdateBusinessAPI(id as string, formData, token)
        : await AddBusinessAPI(formData, token);

      if (res.data?.success) {
        toast({ title: isEdit ? "Business updated" : "Business created" });
        navigate("/businesses");
      }
    } catch (err: any) {
      toast({
        title: isEdit
          ? "Failed to update business"
          : "Failed to create business",
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
          className="h-5 w-5 animate-spin"
          style={{ color: "#9aa3b2" }}
        />
      </div>
    );
  }

  const queueProgressLabel =
    addQueueTotal > 1
      ? `Photo ${addQueueTotal - addQueue.length + 1} of ${addQueueTotal} — `
      : "";

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <button
        onClick={() => navigate("/businesses")}
        className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity"
        style={{ color: "#6b7688" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to businesses
      </button>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1
            className="text-[20px] font-semibold"
            style={{ color: "#101d30" }}
          >
            {isEdit ? "Edit business" : "Add business"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
            {isEdit
              ? "Update this listing."
              : "Create a new listing for the Business Directory."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="h-10 px-5 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 disabled:opacity-60"
            style={{ background: "#E4CE8F", color: "#101d30" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Create business"}
          </button>
        </div>
      </div>

      {/* Basic info — full width, matches PlaceForm.tsx's layout */}
      <div className="rounded-2xl p-6 space-y-4 mb-5" style={cardStyle}>
        <h2
          className="text-[13px] font-semibold uppercase tracking-wider"
          style={{ color: "#8993a6" }}
        >
          Basic info
        </h2>
        <div className="space-y-1.5">
          <Label className={labelClass} style={labelStyle}>
            Name <span style={{ color: "#c9a227" }}>*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. JW Marriott Marco Island"
            className="h-10 rounded-lg text-[14px]"
            style={inputStyle}
          />
        </div>
        <div className="space-y-1.5">
          <Label className={labelClass} style={labelStyle}>
            Short description <span style={{ color: "#c9a227" }}>*</span>
          </Label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="One or two sentences for cards and previews"
            rows={2}
            className="w-full rounded-lg text-[14px] px-3 py-2.5 outline-none resize-none"
            style={inputStyle}
          />
        </div>
      </div>

      {/* About — full width, full TinyMCE feature set matching
          PlaceForm.tsx (drop-cap, image upload, style formats). */}
      <div className="rounded-2xl p-6 md:p-8 space-y-3 mb-5" style={cardStyle}>
        <h2
          className="text-[13px] font-semibold uppercase tracking-wider"
          style={{ color: "#8993a6" }}
        >
          About
        </h2>
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid #e2e5eb" }}
        >
          <Editor
            tinymceScriptSrc="/tinymce/tinymce.min.js"
            licenseKey="gpl"
            value={about}
            onEditorChange={(newContent) => setAbout(newContent)}
            init={{
              height: 500,
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
              content_style: getAboutEditorContentStyle(),
              images_upload_handler: handleAboutImageUpload,
              automatic_uploads: true,
              file_picker_types: "image",
            }}
          />
        </div>
        <p className="text-[11px]" style={{ color: "#c2c7d1" }}>
          Drop or paste images directly into the text — they upload
          automatically and display at a consistent {BUSINESS_IMAGE_RATIO_LABEL}{" "}
          ratio. Use the "Styles" dropdown for headings, Insider Tip callouts,
          and Pull Quotes.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Key highlights */}
          <div className="rounded-2xl p-6 space-y-3" style={cardStyle}>
            <h2
              className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider"
              style={{ color: "#8993a6" }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#c9a227" }} />
              Key highlights
            </h2>

            <div className="flex gap-2">
              <Input
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
                placeholder="e.g. Private Gulf-front beach"
                className="h-10 rounded-lg text-[14px] flex-1"
                style={inputStyle}
              />

              <button
                type="button"
                onClick={addHighlight}
                className="h-10 px-3 rounded-lg flex items-center justify-center"
                style={{ background: "#f2f3f6", color: "#101d30" }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {highlights.map((highlight, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs"
                    style={{
                      background: "#f2f3f6",
                      color: "#101d30",
                    }}
                  >
                    {highlight}

                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      style={{ color: "#8993a6" }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media — unified photo list, first = featured */}
          <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>
            <h2
              className="text-[13px] font-semibold uppercase tracking-wider"
              style={{ color: "#8993a6" }}
            >
              Photos{" "}
              <span
                className="normal-case font-normal"
                style={{ color: "#c2c7d1" }}
              >
                ({photos.length}/{MAX_GALLERY_IMAGES})
              </span>
            </h2>

            <div className="flex flex-wrap gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={photo.key}
                  className="relative"
                  style={{ width: 128 }}
                >
                  <div
                    className="relative rounded-lg overflow-hidden"
                    style={{
                      ...cardStyle,
                      aspectRatio: BUSINESS_IMAGE_ASPECT_CSS,
                    }}
                  >
                    <img
                      src={photo.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(photo.key)}
                      className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(16,29,48,0.7)",
                        color: "#fff",
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <span
                        className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide"
                        style={{ background: "#E4CE8F", color: "#101d30" }}
                      >
                        Featured
                      </span>
                    )}
                  </div>
                  {idx !== 0 && (
                    <button
                      onClick={() => makeFeatured(photo.key)}
                      className="mt-1.5 w-full text-[10px] font-medium py-1 rounded"
                      style={{ background: "#f2f3f6", color: "#6b7688" }}
                    >
                      Set as featured
                    </button>
                  )}
                </div>
              ))}

              {photos.length < MAX_GALLERY_IMAGES && (
                <label
                  className="flex flex-col items-center justify-center gap-1 rounded-lg cursor-pointer flex-shrink-0"
                  style={{
                    width: 128,
                    aspectRatio: BUSINESS_IMAGE_ASPECT_CSS,
                    background: "#f8f9fb",
                    border: "1px dashed #d5d9e0",
                  }}
                >
                  <ImagePlus className="h-5 w-5" style={{ color: "#9aa3b2" }} />
                  <span className="text-[11px]" style={{ color: "#9aa3b2" }}>
                    Add photo
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/webp,image/png"
                    multiple
                    className="hidden"
                    onChange={handleAddPhotos}
                  />
                </label>
              )}
            </div>

            <p
              className="text-[11px] flex items-center gap-1"
              style={{ color: "#c2c7d1" }}
            >
              <CropIcon className="h-3 w-3" />
              JPEG, JPG, WEBP, or PNG · up to {MAX_GALLERY_IMAGES} photos · each
              cropped to {BUSINESS_IMAGE_RATIO_LABEL} · first photo is used as
              the featured image
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={cardStyle}>
            <p
              className={labelClass}
              style={{ ...labelStyle, marginBottom: 10 }}
            >
              Categories
            </p>
            {categories.length ? (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const active = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                      style={
                        active
                          ? {
                              background: "#fbf3de",
                              color: "#a3874f",
                              border: "1px solid #e4ce8f",
                            }
                          : {
                              background: "#f2f3f6",
                              color: "#6b7688",
                              border: "1px solid transparent",
                            }
                      }
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#c2c7d1" }}>
                No categories loaded.
              </p>
            )}
          </div>

          {/* Location — no lat/long, no paid geocoding, just a free map
              embed keyed off the address text (same as PlaceForm.tsx). */}
          <div className="rounded-2xl p-5 space-y-3" style={cardStyle}>
            <p className={labelClass} style={labelStyle}>
              Location
            </p>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
              className="h-9 rounded-lg text-[13.5px]"
              style={inputStyle}
            />
            <Input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Neighborhood (optional)"
              className="h-9 rounded-lg text-[13.5px]"
              style={inputStyle}
            />

            {mapAddress ? (
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid #e2e5eb" }}
              >
                <iframe
                  key={mapAddress}
                  title="Location map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed`}
                  width="100%"
                  height="160"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="rounded-lg flex items-center justify-center gap-1.5"
                style={{
                  height: 160,
                  background: "#f8f9fb",
                  border: "1px dashed #d5d9e0",
                }}
              >
                <MapPinned className="h-4 w-4" style={{ color: "#9aa3b2" }} />
                <span className="text-xs" style={{ color: "#9aa3b2" }}>
                  Map appears once an address is entered
                </span>
              </div>
            )}

            <p className="text-[11px]" style={{ color: "#c2c7d1" }}>
              Visitors can use the address to open the location in Google Maps.
            </p>
          </div>

          <div className="rounded-2xl p-5 space-y-3" style={cardStyle}>
            <p className={labelClass} style={labelStyle}>
              Contact
            </p>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="h-9 rounded-lg text-[13.5px]"
              style={inputStyle}
            />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-9 rounded-lg text-[13.5px]"
              style={inputStyle}
            />
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Website URL"
              className="h-9 rounded-lg text-[13.5px]"
              style={inputStyle}
            />
          </div>

          {/* Before you go — hours + fees/parking/best time */}
          <div className="rounded-2xl p-5 space-y-3" style={cardStyle}>
            <p className={labelClass} style={labelStyle}>
              Before you go
            </p>
            <Input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Hours, e.g. Mon–Sun · 8:00 AM – 10:00 PM"
              className="h-9 rounded-lg text-[13.5px]"
              style={inputStyle}
            />
            <Input
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="Fees, e.g. $25 resort fee"
              className="h-9 rounded-lg text-[13.5px]"
              style={inputStyle}
            />
            <Input
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              placeholder="Parking, e.g. Valet available, $30/night"
              className="h-9 rounded-lg text-[13.5px]"
              style={inputStyle}
            />
            <Input
              value={bestTimeToVisit}
              onChange={(e) => setBestTimeToVisit(e.target.value)}
              placeholder="Best time to visit, e.g. Weekday evenings"
              className="h-9 rounded-lg text-[13.5px]"
              style={inputStyle}
            />
          </div>

          <div className="rounded-2xl p-5" style={cardStyle}>
            <p
              className={labelClass}
              style={{ ...labelStyle, marginBottom: 10 }}
            >
              Price level
            </p>
            <div className="flex gap-1.5">
              {VALID_PRICE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setPriceLevel(priceLevel === level ? "" : level)
                  }
                  className="h-9 flex-1 rounded-lg text-sm font-medium"
                  style={
                    priceLevel === level
                      ? { background: "#101d30", color: "#E4CE8F" }
                      : { background: "#f2f3f6", color: "#6b7688" }
                  }
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
            <p className={labelClass} style={labelStyle}>
              Flags
            </p>
            <button
              type="button"
              onClick={() => setIsFeatured(!isFeatured)}
              className="w-full flex items-center justify-between"
            >
              <span
                className="flex items-center gap-2 text-sm"
                style={{ color: "#101d30" }}
              >
                <Star className="h-3.5 w-3.5" style={{ color: "#8993a6" }} />
                Featured
              </span>
              <span
                className="h-5 w-9 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: isFeatured ? "#E4CE8F" : "#e2e5eb" }}
              >
                <span
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                  style={{ left: isFeatured ? 18 : 2 }}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsTopPick(!isTopPick)}
              className="w-full flex items-center justify-between"
            >
              <span
                className="flex items-center gap-2 text-sm"
                style={{ color: "#101d30" }}
              >
                <Award className="h-3.5 w-3.5" style={{ color: "#8993a6" }} />
                Top pick
              </span>
              <span
                className="h-5 w-9 rounded-full relative transition-colors flex-shrink-0"
                style={{ background: isTopPick ? "#E4CE8F" : "#e2e5eb" }}
              >
                <span
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                  style={{ left: isTopPick ? 18 : 2 }}
                />
              </span>
            </button>

            {isTopPick && (
              <div className="space-y-1.5 pt-1">
                <Label className={labelClass} style={labelStyle}>
                  Top pick rank
                </Label>
                <Input
                  value={topPickRank}
                  onChange={(e) => setTopPickRank(e.target.value)}
                  placeholder="e.g. 1"
                  type="number"
                  className="h-9 rounded-lg text-[13.5px]"
                  style={inputStyle}
                />
                <p className="text-[10.5px]" style={{ color: "#c2c7d1" }}>
                  Nothing currently prevents two listings from sharing the same
                  rank — see note in chat.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
                Crop photo
              </h3>
              <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
                {queueProgressLabel}Drag to reposition, use the slider to zoom.
                The frame is locked at {BUSINESS_IMAGE_RATIO_LABEL}.
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
                aspect={BUSINESS_IMAGE_ASPECT}
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
                onClick={handleCropCancel}
                disabled={cropping}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: "#f2f3f6", color: "#101d30" }}
              >
                {addQueue.length > 1 ? "Skip" : "Cancel"}
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
    </div>
  );
}
