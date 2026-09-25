/** @format */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  boxShadow: "0 1px 3px rgba(16,29,48,0.06)",
};

const infoRow = (
  icon: React.ReactNode,
  label: string,
  value: string | null | undefined,
) => (
  <div className="flex items-start gap-3 py-2.5">
    <div
      className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: "#f2f3f6" }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p
        className="text-[10.5px] tracking-wider uppercase"
        style={{ color: "#9aa3b2" }}
      >
        {label}
      </p>
      <p
        className="text-sm mt-0.5 break-words"
        style={{ color: value ? "#101d30" : "#c2c7d1" }}
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
          className="h-5 w-5 animate-spin"
          style={{ color: "#9aa3b2" }}
        />
      </div>
    );
  }

  if (!place) {
    return (
      <div
        className="w-full px-6 py-16 text-center text-sm"
        style={{ color: "#9aa3b2" }}
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
            className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity"
            style={{ color: "#6b7688" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to places
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              className="text-[22px] font-semibold"
              style={{ color: "#101d30" }}
            >
              {place.name}
            </h1>
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={
                place.is_active
                  ? { background: "#fbf3de", color: "#a3874f" }
                  : { background: "#f1f2f5", color: "#8993a6" }
              }
            >
              {place.is_active ? "Active" : "Inactive"}
            </span>
            {place.is_top_pick && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: "#fbf3de", color: "#a3874f" }}
              >
                <Award className="h-3 w-3" />
                Top Pick{place.top_pick_rank ? ` #${place.top_pick_rank}` : ""}
              </span>
            )}
            {place.is_featured && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: "#eef1fb", color: "#5b6bcf" }}
              >
                <Star className="h-3 w-3" />
                Featured
              </span>
            )}
          </div>
          {place.short_description && (
            <p className="text-sm mt-1.5" style={{ color: "#6b7688" }}>
              {place.short_description}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate(`/places/${place.id}/edit`)}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 flex-shrink-0"
          style={{ background: "#E4CE8F", color: "#101d30" }}
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
            className="rounded-2xl overflow-hidden"
            style={{ ...cardStyle, aspectRatio: "16/9" }}
          >
            {place.featured_image ? (
              <img
                src={`${IMAGE_BASE_URL}${place.featured_image}`}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "#f2f3f6" }}
              >
                <MapPin className="h-8 w-8" style={{ color: "#c2c7d1" }} />
              </div>
            )}
          </div>

          {/* Gallery */}
          {place.gallery_images && place.gallery_images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {place.gallery_images.map((img, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden"
                  style={{ ...cardStyle, aspectRatio: "16/9" }}
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
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2
              className="text-[13px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#8993a6" }}
            >
              About
            </h2>
            {place.about ? (
              <div
                className="text-sm leading-relaxed place-about-content"
                style={{ color: "#334155" }}
                dangerouslySetInnerHTML={{ __html: place.about }}
              />
            ) : (
              <p className="text-sm" style={{ color: "#c2c7d1" }}>
                No description provided.
              </p>
            )}

         {whatToExpect.length > 0 && (
  <div
    className="mt-5 pt-5"
    style={{ borderTop: "1px solid #edeff3" }}
  >
    <p
      className="text-[11px] tracking-wider uppercase mb-3"
      style={{ color: "#9aa3b2" }}
    >
      What to Expect
    </p>

    <div className="space-y-3">
      {whatToExpect.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-3"
          style={{
            background: "#f8f9fb",
            border: "1px solid #e2e5eb",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "#101d30" }}
          >
            {item.title}
          </p>

          <p
            className="text-sm mt-1 leading-relaxed"
            style={{ color: "#6b7688" }}
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
    className="mt-5 pt-5"
    style={{ borderTop: "1px solid #edeff3" }}
  >
    <p
      className="text-[11px] tracking-wider uppercase mb-3"
      style={{ color: "#9aa3b2" }}
    >
      Insider Tips
    </p>

    <ul className="space-y-2">
      {insiderTips.map((tip, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-sm"
          style={{ color: "#101d30" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0"
            style={{ background: "#c9a227" }}
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
            className="rounded-2xl p-5 flex items-center justify-between"
            style={cardStyle}
          >
            <div className="flex items-center gap-2">
              <Star
                className="h-4 w-4"
                style={{ color: "#c9a227" }}
                fill="#c9a227"
              />
              <span
                className="text-lg font-semibold"
                style={{ color: "#101d30" }}
              >
                {place.rating || "—"}
              </span>
              <span className="text-sm" style={{ color: "#9aa3b2" }}>
                ({place.review_count} review
                {place.review_count === 1 ? "" : "s"})
              </span>
            </div>
            {place.price_level && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: "#fbf3de", color: "#a3874f" }}
              >
                {place.price_level}
              </span>
            )}
          </div>

          {/* Location + map */}
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="px-5">
              {infoRow(
                <MapPin className="h-4 w-4" style={{ color: "#8993a6" }} />,
                "Address",
                place.address,
              )}
              <div style={{ borderTop: "1px solid #edeff3" }} />
              {infoRow(
                <MapPinned className="h-4 w-4" style={{ color: "#8993a6" }} />,
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
                style={{ border: 0, display: "block" }}
                loading="lazy"
              />
            )}
          </div>

          {/* Contact */}
          <div className="rounded-2xl px-5" style={cardStyle}>
            {infoRow(
              <Phone className="h-4 w-4" style={{ color: "#8993a6" }} />,
              "Phone",
              place.phone,
            )}
            <div style={{ borderTop: "1px solid #edeff3" }} />
            {infoRow(
              <Mail className="h-4 w-4" style={{ color: "#8993a6" }} />,
              "Email",
              place.email,
            )}
            <div style={{ borderTop: "1px solid #edeff3" }} />
            {infoRow(
              <Globe className="h-4 w-4" style={{ color: "#8993a6" }} />,
              "Website",
              place.website_url,
            )}
          </div>

          {/* Practical info */}
          <div className="rounded-2xl px-5" style={cardStyle}>
            {infoRow(
              <Clock className="h-4 w-4" style={{ color: "#8993a6" }} />,
              "Hours",
              place.hours,
            )}
            <div style={{ borderTop: "1px solid #edeff3" }} />
            {infoRow(
              <DollarSign className="h-4 w-4" style={{ color: "#8993a6" }} />,
              "Fees",
              place.fees,
            )}
            <div style={{ borderTop: "1px solid #edeff3" }} />
            {infoRow(
              <Car className="h-4 w-4" style={{ color: "#8993a6" }} />,
              "Parking",
              place.parking,
            )}
            <div style={{ borderTop: "1px solid #edeff3" }} />
            {infoRow(
              <Sun className="h-4 w-4" style={{ color: "#8993a6" }} />,
              "Best time to visit",
              place.best_time_to_visit,
            )}
          </div>

          {/* Categories */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <p
              className="text-[11px] tracking-wider uppercase mb-2.5"
              style={{ color: "#9aa3b2" }}
            >
              Categories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {place.categories?.length ? (
                place.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "#f2f3f6", color: "#101d30" }}
                  >
                    {cat.name}
                  </span>
                ))
              ) : (
                <span className="text-sm" style={{ color: "#c2c7d1" }}>
                  None assigned
                </span>
              )}
            </div>
          </div>

          {/* Meta */}
          <div
            className="rounded-2xl p-5 text-xs space-y-1.5"
            style={cardStyle}
          >
            <p style={{ color: "#9aa3b2" }}>
              Created {new Date(place.created_at).toLocaleDateString()}
            </p>
            <p style={{ color: "#9aa3b2" }}>
              Updated {new Date(place.updated_at).toLocaleDateString()}
            </p>
            <p style={{ color: "#c2c7d1" }}>Slug: {place.slug}</p>
          </div>
        </div>
      </div>

      {/* Minimal styling so raw HTML from the About editor (paragraphs,
          inline images) reads cleanly here, without importing a whole
          rich-text stylesheet. */}
      <style>{`
        .place-about-content p { margin-bottom: 12px; }
        .place-about-content img { width: 100%; border-radius: 8px; margin: 12px 0; aspect-ratio: 16/9; object-fit: cover; }
        .place-about-content div { margin: 12px 0; font-weight: 600; color: #101d30; }
      `}</style>
    </div>
  );
}
