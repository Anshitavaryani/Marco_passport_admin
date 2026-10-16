/** @format */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Building2,
  MapPin,
  MapPinned,
  Phone,
  Mail,
  Clock,
  Globe,
  Star,
  Award,
  Loader2,
  Pencil,
  DollarSign,
  Car,
  Sun,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetBusinessByIdAPI } from "@/services/Api/BusinessApi";
import { cn } from "@/lib/utils";

const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";

interface BusinessDetail {
  id: number;
  type: string;
  name: string;
  slug: string;
  short_description: string | null;
  about: string | null; // raw HTML
  highlights: string[] | string | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  fees: string | null;
  parking: string | null;
  best_time_to_visit: string | null;
  website_url: string | null;
  price_level: string | null;
  neighborhood: string | null;
  rating: string | null;
  review_count: number;
  is_featured: boolean;
  is_top_pick: boolean;
  top_pick_rank: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories: { id: number; name: string; slug?: string }[];
}

const infoRow = (
  icon: React.ReactNode,
  label: string,
  value: string | null | undefined,
) => (
  <div className="flex items-start gap-3 py-2.5">
    <div
      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-fill"
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p
        className="text-[10.5px] tracking-wider uppercase text-ink-faint"
      >
        {label}
      </p>
      <p
        className={cn("text-sm mt-0.5 wrap-break-word", value ? "text-navy" : "text-ink-ghost")}
      >
        {value || "Not set"}
      </p>
    </div>
  </div>
);

const parseHighlights = (raw: string[] | string | null): string[] => {
  let arr: any[] = [];

  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : [];
    } catch {
      arr = [];
    }
  }

  return arr
    .map((item) => {
      if (typeof item === "string") return item;

      if (item && typeof item === "object") {
        const title = item.title || "";
        const description = item.description || "";

        return description ? `${title}: ${description}` : title;
      }

      return String(item ?? "");
    })
    .filter(Boolean);
};

export default function BusinessView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const res = await GetBusinessByIdAPI(id as string, token);
      if (res.data?.success) {
        setBusiness(res.data.data);
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

  if (loading) {
    return (
      <div className="w-full px-6 py-16 flex justify-center">
        <Loader2
          className="h-5 w-5 animate-spin text-ink-faint"
        />
      </div>
    );
  }

  if (!business) {
    return (
      <div
        className="w-full px-6 py-16 text-center text-sm text-ink-faint"
      >
        Business not found.
      </div>
    );
  }

  const highlights = parseHighlights(business.highlights);

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <button
            onClick={() => navigate("/businesses")}
            className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity text-ink-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to businesses
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              className="text-[22px] font-semibold text-navy"
            >
              {business.name}
            </h1>
            <span
              className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium", business.is_active ? "bg-gold-soft text-gold-dark" : "bg-fill text-ink-subtle")}
            >
              {business.is_active ? "Active" : "Inactive"}
            </span>
            {business.is_top_pick && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold-soft text-gold-dark"
              >
                <Award className="h-3 w-3" />
                Top Pick
                {business.top_pick_rank ? ` #${business.top_pick_rank}` : ""}
              </span>
            )}
            {business.is_featured && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-info-soft text-info"
              >
                <Star className="h-3 w-3" />
                Featured
              </span>
            )}
          </div>
          {business.short_description && (
            <p className="text-sm mt-1.5 text-ink-muted">
              {business.short_description}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate(`/businesses/${business.id}/edit`)}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 shrink-0 bg-gold-light text-navy"
        >
          <Pencil className="h-4 w-4" />
          Edit business
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Hero image */}
          <div
            className="rounded-2xl overflow-hidden bg-white border border-line shadow-card aspect-video"
          >
            {business.featured_image ? (
              <img
                src={`${IMAGE_BASE_URL}${business.featured_image}`}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center bg-fill"
              >
                <Building2 className="h-8 w-8 text-ink-ghost" />
              </div>
            )}
          </div>

          {/* Gallery */}
          {business.gallery_images && business.gallery_images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {business.gallery_images.map((img, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden bg-white border border-line shadow-card aspect-video"
                >
                  <img
                    src={`${IMAGE_BASE_URL}${img}`}
                    alt={`${business.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* About */}
          <div className="rounded-2xl p-6 bg-white border border-line shadow-card">
            <h2
              className="text-[13px] font-semibold uppercase tracking-wider mb-3 text-ink-subtle"
            >
              About
            </h2>
            {business.about ? (
              <div
                className="text-sm leading-relaxed business-about-content text-prose"
                dangerouslySetInnerHTML={{ __html: business.about }}
              />
            ) : (
              <p className="text-sm text-ink-ghost">
                No description provided.
              </p>
            )}
          </div>

          {/* Key highlights */}
          {highlights.length > 0 && (
            <div className="rounded-2xl p-6 bg-white border border-line shadow-card">
              <h2
                className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider mb-3 text-ink-subtle"
              >
                <Sparkles
                  className="h-3.5 w-3.5 text-gold"
                />
                Key highlights
              </h2>

              <ul className="space-y-1.5">
                {highlights.map((highlight, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2 text-navy"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 bg-gold"
                    />

                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Stats */}
          <div
            className="rounded-2xl p-5 flex items-center justify-between bg-white border border-line shadow-card"
          >
            <div className="flex items-center gap-2">
              <Star
                className="h-4 w-4 text-gold fill-gold"
              />
              <span
                className="text-lg font-semibold text-navy"
              >
                {business.rating || "—"}
              </span>
              <span className="text-sm text-ink-faint">
                ({business.review_count} review
                {business.review_count === 1 ? "" : "s"})
              </span>
            </div>
            {business.price_level && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gold-soft text-gold-dark"
              >
                {business.price_level}
              </span>
            )}
          </div>

          {/* Location + map */}
          <div className="rounded-2xl overflow-hidden bg-white border border-line shadow-card">
            <div className="px-5">
              {infoRow(
                <MapPin className="h-4 w-4 text-ink-subtle" />,
                "Address",
                business.address,
              )}
              <div className="border-t border-line-soft" />
              {infoRow(
                <MapPinned className="h-4 w-4 text-ink-subtle" />,
                "Neighborhood",
                business.neighborhood,
              )}
            </div>
            {business.address && (
              <iframe
                title="Location map"
                src={`https://www.google.com/maps?q=${encodeURIComponent(business.address)}&output=embed`}
                width="100%"
                height="180"
                className="border-0 block"
                loading="lazy"
              />
            )}
          </div>

          {/* Contact */}
          <div className="rounded-2xl px-5 bg-white border border-line shadow-card">
            {infoRow(
              <Phone className="h-4 w-4 text-ink-subtle" />,
              "Phone",
              business.phone,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <Mail className="h-4 w-4 text-ink-subtle" />,
              "Email",
              business.email,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <Globe className="h-4 w-4 text-ink-subtle" />,
              "Website",
              business.website_url,
            )}
          </div>

          {/* Before you go */}
          <div className="rounded-2xl px-5 bg-white border border-line shadow-card">
            {infoRow(
              <Clock className="h-4 w-4 text-ink-subtle" />,
              "Hours",
              business.hours,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <DollarSign className="h-4 w-4 text-ink-subtle" />,
              "Fees",
              business.fees,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <Car className="h-4 w-4 text-ink-subtle" />,
              "Parking",
              business.parking,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <Sun className="h-4 w-4 text-ink-subtle" />,
              "Best time to visit",
              business.best_time_to_visit,
            )}
          </div>

          {/* Categories */}
          <div className="rounded-2xl p-5 bg-white border border-line shadow-card">
            <p
              className="text-[11px] tracking-wider uppercase mb-2.5 text-ink-faint"
            >
              Categories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {business.categories?.length ? (
                business.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-fill text-navy"
                  >
                    {cat.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-ink-ghost">
                  None assigned
                </span>
              )}
            </div>
          </div>

          {/* Meta */}
          <div
            className="rounded-2xl p-5 text-xs space-y-1.5 bg-white border border-line shadow-card"
          >
            <p className="text-ink-faint">
              Created {new Date(business.created_at).toLocaleDateString()}
            </p>
            <p className="text-ink-faint">
              Updated {new Date(business.updated_at).toLocaleDateString()}
            </p>
            <p className="text-ink-ghost">Slug: {business.slug}</p>
          </div>
        </div>
      </div>

      {/* Minimal styling so raw HTML from the About editor reads cleanly. */}
      <style>{`
        .business-about-content p { margin-bottom: 12px; }
        .business-about-content img { width: 100%; border-radius: 8px; margin: 12px 0; aspect-ratio: 16/9; object-fit: cover; }
      `}</style>
    </div>
  );
}
