/** @format */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Star, Loader2, Newspaper, Tag, Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetBlogByIdAPI } from "@/services/Api/BlogApi";
import "./article-content.css";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";

// Same ratio the featured image is cropped to in BlogForm — keeps the
// preview from cropping the image a second time.
const FEATURED_IMAGE_RATIO_W = 16;
const FEATURED_IMAGE_RATIO_H = 9;
const FEATURED_IMAGE_ASPECT_CSS = `${FEATURED_IMAGE_RATIO_W}/${FEATURED_IMAGE_RATIO_H}`;

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  boxShadow: "0 1px 3px rgba(16,29,48,0.06)",
};

interface BlogDetail {
  id: number;
  title: string;
  description: string;
  content: string;
  featured_image: string | null;
  is_featured: boolean;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Category is optional — a blog can exist without one
  blog_category?: { id: number; name: string } | null;
}

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "—";

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "#f2f3f6" }}
      >
        <Icon className="h-4 w-4" style={{ color: "#8993a6" }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] tracking-wider uppercase" style={{ color: "#9aa3b2" }}>
          {label}
        </p>
        <div className="text-sm mt-0.5" style={{ color: "#101d30" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function BlogView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const res = await GetBlogByIdAPI(id as string, token);
      if (res.data?.success) setBlog(res.data.data);
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

  if (loading) {
    return (
      <div className="w-full px-6 py-16 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#9aa3b2" }} />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="w-full px-6 py-16 text-center text-sm" style={{ color: "#9aa3b2" }}>
        Blog not found.
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="min-w-0">
          <button
            onClick={() => navigate("/blogs")}
            className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity"
            style={{ color: "#6b7688" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to blogs
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-semibold" style={{ color: "#101d30" }}>
              {blog.title}
            </h1>
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={
                blog.is_active
                  ? { background: "#fbf3de", color: "#a3874f" }
                  : { background: "#f1f2f5", color: "#8993a6" }
              }
            >
              {blog.is_active ? "Active" : "Inactive"}
            </span>
            {blog.is_featured && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: "#fbf3de", color: "#a3874f" }}
              >
                <Star className="h-3 w-3" />
                Featured
              </span>
            )}
          </div>
          <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "#6b7688" }}>
            {blog.description}
          </p>
        </div>

        <button
          onClick={() => navigate(`/blogs/${blog.id}/edit`)}
          className="h-10 px-4 rounded-lg font-semibold text-sm tracking-wide flex items-center gap-2 flex-shrink-0"
          style={{ background: "#E4CE8F", color: "#101d30" }}
        >
          <Pencil className="h-4 w-4" />
          Edit blog
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl overflow-hidden" style={{ ...cardStyle, aspectRatio: FEATURED_IMAGE_ASPECT_CSS }}>
            {blog.featured_image ? (
              <img
                src={`${IMAGE_BASE_URL}${blog.featured_image}`}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "#f2f3f6" }}>
                <Newspaper className="h-8 w-8" style={{ color: "#c2c7d1" }} />
              </div>
            )}
          </div>

          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: "#8993a6" }}>
              Article
            </h2>
            {/* article-body, not Tailwind's prose classes — see article-content.css */}
            <div className="article-body" dangerouslySetInnerHTML={{ __html: blog.content }} />
          </div>
        </div>

        {/* Single details card — sticks alongside the article on large screens */}
        <div className="rounded-2xl p-5 space-y-4 lg:sticky lg:top-6" style={cardStyle}>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "#8993a6" }}>
            Details
          </h2>

          <DetailRow icon={Tag} label="Category">
            {blog.blog_category?.name ? (
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "#f2f3f6", color: "#101d30" }}
              >
                {blog.blog_category.name}
              </span>
            ) : (
              <span style={{ color: "#b4bac6" }}>Uncategorized</span>
            )}
          </DetailRow>

          <DetailRow icon={Calendar} label="Published">
            {formatDate(blog.published_at)}
          </DetailRow>

          <DetailRow icon={RefreshCw} label="Last updated">
            {formatDate(blog.updated_at)}
          </DetailRow>
        </div>
      </div>
    </div>
  );
}