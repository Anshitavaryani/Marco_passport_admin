/** @format */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
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
  ZoomIn,
  Crop as CropIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/rich-text-editor";
import {
  AddBusinessAPI,
  UpdateBusinessAPI,
  GetBusinessByIdAPI,
  GetBusinessCategoriesAPI,
} from "@/services/Api/BusinessApi";
import { cn } from "@/lib/utils";

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

// ↓↓↓ Only place to change the crop ratio. Same value as Places: 16:9. ↓↓↓
const BUSINESS_IMAGE_RATIO_W = 16;
const BUSINESS_IMAGE_RATIO_H = 9;
const BUSINESS_IMAGE_ASPECT = BUSINESS_IMAGE_RATIO_W / BUSINESS_IMAGE_RATIO_H;
const BUSINESS_IMAGE_ASPECT_CSS = `${BUSINESS_IMAGE_RATIO_W}/${BUSINESS_IMAGE_RATIO_H}`;
const BUSINESS_IMAGE_RATIO_LABEL = `${BUSINESS_IMAGE_RATIO_W}:${BUSINESS_IMAGE_RATIO_H}`;

const labelClass = "text-[11px] tracking-wider uppercase text-ink-subtle";

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
    if (!name.trim() || !shortDescription.trim() || !address.trim()) {
      toast({
        title: "Name, short description and address are required",
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

      formData.append("address", address.trim());
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
          className="h-5 w-5 animate-spin text-ink-faint"
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
        className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity text-ink-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to businesses
      </button>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1
            className="text-[20px] font-semibold text-navy"
          >
            {isEdit ? "Edit business" : "Add business"}
          </h1>
          <p className="text-sm mt-1 text-ink-muted">
            {isEdit
              ? "Update this listing."
              : "Create a new listing for the Business Directory."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="h-10 px-5 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 disabled:opacity-60 bg-gold-light text-navy"
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
      <div className="rounded-2xl p-6 space-y-4 mb-5 bg-white border border-line shadow-card">
        <h2
          className="text-[13px] font-semibold uppercase tracking-wider text-ink-subtle"
        >
          Basic info
        </h2>
        <div className="space-y-1.5">
          <Label className={`${labelClass} leading-6`}>
            Name <span className="text-gold">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. JW Marriott Marco Island"
            className="h-10 rounded-lg text-[14px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className={`${labelClass} leading-6`}>
            Short description <span className="text-gold">*</span>
          </Label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="One or two sentences for cards and previews"
            rows={2}
            className="w-full rounded-lg text-[14px] px-3 py-2.5 outline-hidden resize-none bg-white border border-line text-navy"
          />
        </div>
      </div>

      {/* About — full width, same rich-text editor as PlaceForm.tsx
          (drop-cap, image upload, style formats). */}
      <div className="rounded-2xl p-6 md:p-8 space-y-3 mb-5 bg-white border border-line shadow-card">
        <h2
          className="text-[13px] font-semibold uppercase tracking-wider text-ink-subtle"
        >
          About
        </h2>
        <div
          className="rounded-lg overflow-hidden border border-line"
        >
          <RichTextEditor
            value={about}
            onChange={setAbout}
            height={500}
            imageAspectRatio={BUSINESS_IMAGE_ASPECT_CSS}
          />
        </div>
        <p className="text-[11px] text-ink-ghost">
          Drop or paste images directly into the text — they upload
          automatically and display at a consistent {BUSINESS_IMAGE_RATIO_LABEL}{" "}
          ratio. Use the "Formats" menu for headings, Insider Tip callouts,
          and Pull Quotes.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Key highlights */}
          <div className="rounded-2xl p-6 space-y-3 bg-white border border-line shadow-card">
            <h2
              className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-ink-subtle"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold" />
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
              />

              <button
                type="button"
                onClick={addHighlight}
                className="h-10 px-3 rounded-lg flex items-center justify-center bg-fill text-navy"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {highlights.map((highlight, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs bg-fill text-navy"
                  >
                    {highlight}

                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="text-ink-subtle"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media — unified photo list, first = featured */}
          <div className="rounded-2xl p-6 space-y-4 bg-white border border-line shadow-card">
            <h2
              className="text-[13px] font-semibold uppercase tracking-wider text-ink-subtle"
            >
              Photos{" "}
              <span
                className="normal-case font-normal text-ink-ghost"
              >
                ({photos.length}/{MAX_GALLERY_IMAGES})
              </span>
            </h2>

            <div className="flex flex-wrap gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={photo.key}
                  className="relative w-[128px]"
                >
                  <div
                    className="relative rounded-lg overflow-hidden bg-white border border-line shadow-card"
                    style={{ aspectRatio: BUSINESS_IMAGE_ASPECT_CSS }}
                  >
                    <img
                      src={photo.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(photo.key)}
                      className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center bg-navy/70 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <span
                        className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide bg-gold-light text-navy"
                      >
                        Featured
                      </span>
                    )}
                  </div>
                  {idx !== 0 && (
                    <button
                      onClick={() => makeFeatured(photo.key)}
                      className="mt-1.5 w-full text-[10px] font-medium py-1 rounded bg-fill text-ink-muted"
                    >
                      Set as featured
                    </button>
                  )}
                </div>
              ))}

              {photos.length < MAX_GALLERY_IMAGES && (
                <label
                  className="flex flex-col items-center justify-center gap-1 rounded-lg cursor-pointer shrink-0 w-[128px] bg-surface-muted border border-dashed border-line-strong"
                  style={{ aspectRatio: BUSINESS_IMAGE_ASPECT_CSS }}
                >
                  <ImagePlus className="h-5 w-5 text-ink-faint" />
                  <span className="text-[11px] text-ink-faint">
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
              className="text-[11px] flex items-center gap-1 text-ink-ghost"
            >
              <CropIcon className="h-3 w-3" />
              JPEG, JPG, WEBP, or PNG · up to {MAX_GALLERY_IMAGES} photos · each
              cropped to {BUSINESS_IMAGE_RATIO_LABEL} · first photo is used as
              the featured image
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl p-5 bg-white border border-line shadow-card">
            <p
              className={`${labelClass} mb-2.5`}
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
                      className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors border", active ? "bg-gold-soft text-gold-dark border-gold-light" : "bg-fill text-ink-muted border-transparent")}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-ink-ghost">
                No categories loaded.
              </p>
            )}
          </div>

          {/* Location — no lat/long, no paid geocoding, just a free map
              embed keyed off the address text (same as PlaceForm.tsx). */}
          <div className="rounded-2xl p-5 space-y-3 bg-white border border-line shadow-card">
            <p className={labelClass}>
              Location <span className="text-gold">*</span>
            </p>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full street address (required)"
              required
              aria-required="true"
              className="h-9 rounded-lg text-[13.5px]"
            />
            <Input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Neighborhood (optional)"
              className="h-9 rounded-lg text-[13.5px]"
            />

            {mapAddress ? (
              <div
                className="rounded-lg overflow-hidden border border-line"
              >
                <iframe
                  key={mapAddress}
                  title="Location map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed`}
                  width="100%"
                  height="160"
                  className="border-0 block"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="rounded-lg flex items-center justify-center gap-1.5 h-[160px] bg-surface-muted border border-dashed border-line-strong"
              >
                <MapPinned className="h-4 w-4 text-ink-faint" />
                <span className="text-xs text-ink-faint">
                  Map appears once an address is entered
                </span>
              </div>
            )}

            <p className="text-[11px] text-ink-ghost">
              Required. Itinerary maps pin this listing by its name and
              address, so enter the complete street address.
            </p>
          </div>

          <div className="rounded-2xl p-5 space-y-3 bg-white border border-line shadow-card">
            <p className={labelClass}>
              Contact
            </p>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="h-9 rounded-lg text-[13.5px]"
            />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-9 rounded-lg text-[13.5px]"
            />
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Website URL"
              className="h-9 rounded-lg text-[13.5px]"
            />
          </div>

          {/* Before you go — hours + fees/parking/best time */}
          <div className="rounded-2xl p-5 space-y-3 bg-white border border-line shadow-card">
            <p className={labelClass}>
              Before you go
            </p>
            <Input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Hours, e.g. Mon–Sun · 8:00 AM – 10:00 PM"
              className="h-9 rounded-lg text-[13.5px]"
            />
            <Input
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              placeholder="Fees, e.g. $25 resort fee"
              className="h-9 rounded-lg text-[13.5px]"
            />
            <Input
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              placeholder="Parking, e.g. Valet available, $30/night"
              className="h-9 rounded-lg text-[13.5px]"
            />
            <Input
              value={bestTimeToVisit}
              onChange={(e) => setBestTimeToVisit(e.target.value)}
              placeholder="Best time to visit, e.g. Weekday evenings"
              className="h-9 rounded-lg text-[13.5px]"
            />
          </div>

          <div className="rounded-2xl p-5 bg-white border border-line shadow-card">
            <p
              className={`${labelClass} mb-2.5`}
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
                  className={cn("h-9 flex-1 rounded-lg text-sm font-medium", priceLevel === level ? "bg-navy text-gold-light" : "bg-fill text-ink-muted")}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-5 space-y-4 bg-white border border-line shadow-card">
            <p className={labelClass}>
              Flags
            </p>
            <button
              type="button"
              onClick={() => setIsFeatured(!isFeatured)}
              className="w-full flex items-center justify-between"
            >
              <span
                className="flex items-center gap-2 text-sm text-navy"
              >
                <Star className="h-3.5 w-3.5 text-ink-subtle" />
                Featured
              </span>
              <span
                className={cn("h-5 w-9 rounded-full relative transition-colors shrink-0", isFeatured ? "bg-gold-light" : "bg-line")}
              >
                <span
                  className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", isFeatured ? "left-4.5" : "left-0.5")}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsTopPick(!isTopPick)}
              className="w-full flex items-center justify-between"
            >
              <span
                className="flex items-center gap-2 text-sm text-navy"
              >
                <Award className="h-3.5 w-3.5 text-ink-subtle" />
                Top pick
              </span>
              <span
                className={cn("h-5 w-9 rounded-full relative transition-colors shrink-0", isTopPick ? "bg-gold-light" : "bg-line")}
              >
                <span
                  className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", isTopPick ? "left-4.5" : "left-0.5")}
                />
              </span>
            </button>

            {isTopPick && (
              <div className="space-y-1.5 pt-1">
                <Label className={`${labelClass} leading-6`}>
                  Top pick rank
                </Label>
                <Input
                  value={topPickRank}
                  onChange={(e) => setTopPickRank(e.target.value)}
                  placeholder="e.g. 1"
                  type="number"
                  className="h-9 rounded-lg text-[13.5px]"
                />
                <p className="text-[10.5px] text-ink-ghost">
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
                Crop photo
              </h3>
              <p className="text-sm mt-1 text-ink-muted">
                {queueProgressLabel}Drag to reposition, use the slider to zoom.
                The frame is locked at {BUSINESS_IMAGE_RATIO_LABEL}.
              </p>
            </div>

            <div
              className="relative w-full h-[380px] bg-navy"
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
                onClick={handleCropCancel}
                disabled={cropping}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50 bg-fill text-navy"
              >
                {addQueue.length > 1 ? "Skip" : "Cancel"}
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
