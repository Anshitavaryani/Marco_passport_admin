/** @format */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Loader2, Star, Route, Mail, Phone, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetUserDetailsAPI } from "@/services/Api/UserApi";
import { cn } from "@/lib/utils";

interface UserDetail {
  id: number;
  email: string;
  status: string;
  user_profile?: { name?: string; mobile?: string; created_at?: string };
  user_reviews?: Array<{
    id: number;
    place_id: number;
    rating?: number;
    comment?: string;
    created_at?: string;
    review_place?: { id: number; name: string } | null;
  }>;
  itineraries?: Array<{
    id: number;
    name: string;
    start_date?: string | null;
    end_date?: string | null;
    created_at?: string;
    items?: Array<{
      id: number;
      position: number;
      visit_date?: string | null;
      place?: { id: number; name: string; type?: string } | null;
    }>;
  }>;
}

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await GetUserDetailsAPI(Number(id));
        setUser(res.data?.data || null);
      } catch (err: any) {
        toast({
          title: "Failed to load user",
          description: err.response?.data?.message || "Something went wrong.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-14 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full px-6 py-14 text-center text-sm text-ink-faint">
        User not found.
      </div>
    );
  }

  const reviews = user.user_reviews ?? [];
  const itineraries = user.itineraries ?? [];

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <button
        onClick={() => navigate("/users")}
        className="flex items-center gap-1.5 text-sm mb-4 text-ink-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </button>

      {/* Profile card */}
      <div className="rounded-2xl p-6 mb-5 flex items-center justify-between flex-wrap gap-4 bg-white border border-line shadow-card">
        <div>
          <h1 className="text-[20px] font-semibold text-navy">
            {user.user_profile?.name || "Unnamed User"}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-[13px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gold" />
              {user.email}
            </span>
            {user.user_profile?.mobile && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gold" />
                {user.user_profile.mobile}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gold" />
              Joined {formatDate(user.user_profile?.created_at)}
            </span>
          </div>
        </div>
        <span
          className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium", user.status?.toLowerCase() === "accepted" ? "bg-gold-soft text-gold-dark" : "bg-fill text-ink-subtle")}
        >
          {user.status || "Pending"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Reviews */}
        <div className="rounded-2xl overflow-hidden bg-white border border-line shadow-card">
          <div className="px-5 py-4 flex items-center gap-2 border-b border-line-soft">
            <Star className="h-4 w-4 text-gold" />
            <h2 className="text-[14px] font-semibold text-navy">
              Reviews ({reviews.length})
            </h2>
          </div>
          <div className="divide-y border-line-soft">
            {reviews.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-faint">
                No reviews yet.
              </p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-medium text-navy">
                      {r.review_place?.name || "Place unavailable"}
                    </span>
                    <span className="text-[11.5px] text-ink-faint">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  {r.rating !== undefined && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn("h-3 w-3", i < (r.rating || 0) ? "text-gold" : "text-line", i < (r.rating || 0) ? "fill-gold" : "fill-none")}
                        />
                      ))}
                    </div>
                  )}
                  {r.comment && (
                    <p className="text-[13px] mt-1.5 text-ink-muted">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Itineraries */}
        <div className="rounded-2xl overflow-hidden bg-white border border-line shadow-card">
          <div className="px-5 py-4 flex items-center gap-2 border-b border-line-soft">
            <Route className="h-4 w-4 text-gold" />
            <h2 className="text-[14px] font-semibold text-navy">
              Itineraries ({itineraries.length})
            </h2>
          </div>
          <div className="divide-y border-line-soft">
            {itineraries.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-faint">
                No itineraries yet.
              </p>
            ) : (
              itineraries.map((it) => {
                const items = [...(it.items ?? [])].sort((a, b) => a.position - b.position);
                const dates =
                  it.start_date || it.end_date
                    ? `${formatDate(it.start_date ?? undefined)} – ${formatDate(it.end_date ?? undefined)}`
                    : "No dates";
                return (
                  <div key={it.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13.5px] font-medium text-navy">
                        {it.name}
                      </span>
                      <span className="text-[11.5px] shrink-0 text-ink-faint">
                        {dates}
                      </span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-[12.5px] mt-1 text-ink-faint">
                        No places yet.
                      </p>
                    ) : (
                      <ol className="mt-2 space-y-1">
                        {items.map((item, index) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-3 text-[12.5px] text-ink-muted"
                          >
                            <span className="truncate">
                              {index + 1}. {item.place?.name || "Place unavailable"}
                              {item.place?.type === "business" && (
                                <span className="text-gold-dark"> · Business</span>
                              )}
                            </span>
                            {item.visit_date && (
                              <span className="shrink-0 text-ink-faint">
                                {formatDate(item.visit_date)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}