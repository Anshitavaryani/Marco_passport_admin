/** @format */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetPlaceByIdAPI } from "@/services/Api/PlacesApi";
import { cn } from "@/lib/utils";

const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";

interface PlaceDetail {
  id: number;
  type: string;
  name: string;
  slug: string;
  short_description: string | null;
  about: string | null; // raw HTML
  what_to_expect: { title: string; description: string }[] | string | null;
  insider_tips: string[] | string | null;
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

const parseWhatToExpect = (
  raw: { title: string; description: string }[] | string | null,
): { title: string; description: string }[] => {
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

const parseInsiderTips = (raw: string[] | string | null): string[] => {
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

export default function PlaceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPlace = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const res = await GetPlaceByIdAPI(id as string, token);
      if (res.data?.success) {
        setPlace(res.data.data);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load place",
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

  if (!place) {
    return (
      <div
        className="w-full px-6 py-16 text-center text-sm text-ink-faint"
      >
        Place not found.
      </div>
    );
  }

  const whatToExpect = parseWhatToExpect(place.what_to_expect);
  const insiderTips = parseInsiderTips(place.insider_tips);

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <button
            onClick={() => navigate("/places")}
            className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity text-ink-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to places
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              className="text-[22px] font-semibold text-navy"
            >
              {place.name}
            </h1>
            <span
              className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium", place.is_active ? "bg-gold-soft text-gold-dark" : "bg-fill text-ink-subtle")}
            >
              {place.is_active ? "Active" : "Inactive"}
            </span>
            {place.is_top_pick && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gold-soft text-gold-dark"
              >
                <Award className="h-3 w-3" />
                Top Pick{place.top_pick_rank ? ` #${place.top_pick_rank}` : ""}
              </span>
            )}
            {place.is_featured && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-info-soft text-info"
              >
                <Star className="h-3 w-3" />
                Featured
              </span>
            )}
          </div>
          {place.short_description && (
            <p className="text-sm mt-1.5 text-ink-muted">
              {place.short_description}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate(`/places/${place.id}/edit`)}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 shrink-0 bg-gold-light text-navy"
        >
          <Pencil className="h-4 w-4" />
          Edit place
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Hero image */}
          <div
            className="rounded-2xl overflow-hidden bg-white border border-line shadow-card aspect-video"
          >
            {place.featured_image ? (
              <img
                src={`${IMAGE_BASE_URL}${place.featured_image}`}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center bg-fill"
              >
                <MapPin className="h-8 w-8 text-ink-ghost" />
              </div>
            )}
          </div>

          {/* Gallery */}
          {place.gallery_images && place.gallery_images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {place.gallery_images.map((img, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden bg-white border border-line shadow-card aspect-video"
                >
                  <img
                    src={`${IMAGE_BASE_URL}${img}`}
                    alt={`${place.name} ${i + 1}`}
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
            {place.about ? (
              <div
                className="text-sm leading-relaxed place-about-content text-prose"
                dangerouslySetInnerHTML={{ __html: place.about }}
              />
            ) : (
              <p className="text-sm text-ink-ghost">
                No description provided.
              </p>
            )}

         {whatToExpect.length > 0 && (
  <div
    className="mt-5 pt-5 border-t border-line-soft"
  >
    <p
      className="text-[11px] tracking-wider uppercase mb-3 text-ink-faint"
    >
      What to Expect
    </p>

    <div className="space-y-3">
      {whatToExpect.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-3 bg-surface-muted border border-line"
        >
          <p
            className="text-sm font-semibold text-navy"
          >
            {item.title}
          </p>

          <p
            className="text-sm mt-1 leading-relaxed text-ink-muted"
          >
            {item.description}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

{insiderTips.length > 0 && (
  <div
    className="mt-5 pt-5 border-t border-line-soft"
  >
    <p
      className="text-[11px] tracking-wider uppercase mb-3 text-ink-faint"
    >
      Insider Tips
    </p>

    <ul className="space-y-2">
      {insiderTips.map((tip, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-sm text-navy"
        >
          <span
            className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 bg-gold"
          />
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  </div>
)}
          </div>
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
                {place.rating || "—"}
              </span>
              <span className="text-sm text-ink-faint">
                ({place.review_count} review
                {place.review_count === 1 ? "" : "s"})
              </span>
            </div>
            {place.price_level && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gold-soft text-gold-dark"
              >
                {place.price_level}
              </span>
            )}
          </div>

          {/* Location + map */}
          <div className="rounded-2xl overflow-hidden bg-white border border-line shadow-card">
            <div className="px-5">
              {infoRow(
                <MapPin className="h-4 w-4 text-ink-subtle" />,
                "Address",
                place.address,
              )}
              <div className="border-t border-line-soft" />
              {infoRow(
                <MapPinned className="h-4 w-4 text-ink-subtle" />,
                "Neighborhood",
                place.neighborhood,
              )}
            </div>
            {place.address && (
              <iframe
                title="Location map"
                src={`https://www.google.com/maps?q=${encodeURIComponent(place.address)}&output=embed`}
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
              place.phone,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <Mail className="h-4 w-4 text-ink-subtle" />,
              "Email",
              place.email,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <Globe className="h-4 w-4 text-ink-subtle" />,
              "Website",
              place.website_url,
            )}
          </div>

          {/* Practical info */}
          <div className="rounded-2xl px-5 bg-white border border-line shadow-card">
            {infoRow(
              <Clock className="h-4 w-4 text-ink-subtle" />,
              "Hours",
              place.hours,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <DollarSign className="h-4 w-4 text-ink-subtle" />,
              "Fees",
              place.fees,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <Car className="h-4 w-4 text-ink-subtle" />,
              "Parking",
              place.parking,
            )}
            <div className="border-t border-line-soft" />
            {infoRow(
              <Sun className="h-4 w-4 text-ink-subtle" />,
              "Best time to visit",
              place.best_time_to_visit,
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
              {place.categories?.length ? (
                place.categories.map((cat) => (
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
              Created {new Date(place.created_at).toLocaleDateString()}
            </p>
            <p className="text-ink-faint">
              Updated {new Date(place.updated_at).toLocaleDateString()}
            </p>
            <p className="text-ink-ghost">Slug: {place.slug}</p>
          </div>
        </div>
      </div>

      {/* Minimal styling so raw HTML from the About editor (paragraphs,
          inline images) reads cleanly here, without importing a whole
          rich-text stylesheet. */}
      <style>{`
        .place-about-content p { margin-bottom: 12px; }
        .place-about-content img { width: 100%; border-radius: 8px; margin: 12px 0; aspect-ratio: 16/9; object-fit: cover; }
        .place-about-content div { margin: 12px 0; font-weight: 600; color: var(--color-navy); }
      `}</style>
    </div>
  );
}
