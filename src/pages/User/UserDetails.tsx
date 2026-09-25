/** @format */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Star, BookmarkCheck, Mail, Phone, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetUserDetailsAPI } from "@/services/Api/UserApi";

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  boxShadow: "0 1px 3px rgba(16,29,48,0.06)",
};

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
  user_passports?: Array<{
    id: number;
    place_id: number;
    created_at?: string;
    passport_place?: { id: number; name: string } | null;
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
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#9aa3b2" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full px-6 py-14 text-center text-sm" style={{ color: "#9aa3b2" }}>
        User not found.
      </div>
    );
  }

  const reviews = user.user_reviews ?? [];
  const passports = user.user_passports ?? [];

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <button
        onClick={() => navigate("/users")}
        className="flex items-center gap-1.5 text-sm mb-4"
        style={{ color: "#6b7688" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </button>

      {/* Profile card */}
      <div className="rounded-2xl p-6 mb-5 flex items-center justify-between flex-wrap gap-4" style={cardStyle}>
        <div>
          <h1 className="text-[20px] font-semibold" style={{ color: "#101d30" }}>
            {user.user_profile?.name || "Unnamed User"}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-[13px]" style={{ color: "#6b7688" }}>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" style={{ color: "#c9a227" }} />
              {user.email}
            </span>
            {user.user_profile?.mobile && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" style={{ color: "#c9a227" }} />
                {user.user_profile.mobile}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" style={{ color: "#c9a227" }} />
              Joined {formatDate(user.user_profile?.created_at)}
            </span>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
          style={
            user.status?.toLowerCase() === "accepted"
              ? { background: "#fbf3de", color: "#a3874f" }
              : { background: "#f1f2f5", color: "#8993a6" }
          }
        >
          {user.status || "Pending"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Reviews */}
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #edeff3" }}>
            <Star className="h-4 w-4" style={{ color: "#c9a227" }} />
            <h2 className="text-[14px] font-semibold" style={{ color: "#101d30" }}>
              Reviews ({reviews.length})
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#edeff3" }}>
            {reviews.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm" style={{ color: "#9aa3b2" }}>
                No reviews yet.
              </p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-medium" style={{ color: "#101d30" }}>
                      {r.review_place?.name || "Place unavailable"}
                    </span>
                    <span className="text-[11.5px]" style={{ color: "#9aa3b2" }}>
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  {r.rating !== undefined && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3"
                          style={{
                            color: i < (r.rating || 0) ? "#c9a227" : "#e2e5eb",
                            fill: i < (r.rating || 0) ? "#c9a227" : "none",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {r.comment && (
                    <p className="text-[13px] mt-1.5" style={{ color: "#6b7688" }}>
                      {r.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Passport additions */}
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #edeff3" }}>
            <BookmarkCheck className="h-4 w-4" style={{ color: "#c9a227" }} />
            <h2 className="text-[14px] font-semibold" style={{ color: "#101d30" }}>
              Passport additions ({passports.length})
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#edeff3" }}>
            {passports.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm" style={{ color: "#9aa3b2" }}>
                Nothing saved yet.
              </p>
            ) : (
              passports.map((p) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                  <span className="text-[13.5px] font-medium" style={{ color: "#101d30" }}>
                    {p.passport_place?.name || "Place unavailable"}
                  </span>
                  <span className="text-[11.5px]" style={{ color: "#9aa3b2" }}>
                    {formatDate(p.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}