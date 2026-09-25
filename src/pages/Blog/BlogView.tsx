/** @format */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Star, Clock, User, Loader2, Newspaper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetBlogByIdAPI } from "@/services/Api/BlogApi";
import "./article-content.css";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "https://api.themarcopassport.com";

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
  written_by: string;
  read_time_minutes: number | null;
  is_featured: boolean;
  is_active: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  blog_category?: { id: number; name: string };
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
        <div>
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
          <p className="text-sm mt-1.5" style={{ color: "#6b7688" }}>
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

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl overflow-hidden" style={{ ...cardStyle, aspectRatio: "16/7" }}>
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
            {/* article-body, not Tailwind's prose classes — see
                article-content.css for why: prose's built-in
                heading/blockquote/image rules would otherwise conflict
                with the custom .insider-tip/.pull-quote/image-ratio
                rules that need to match the live site exactly. */}
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl p-5 space-y-3" style={cardStyle}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f2f3f6" }}>
                <User className="h-4 w-4" style={{ color: "#8993a6" }} />
              </div>
              <div>
                <p className="text-[10.5px] tracking-wider uppercase" style={{ color: "#9aa3b2" }}>
                  Written by
                </p>
                <p className="text-sm mt-0.5" style={{ color: "#101d30" }}>
                  {blog.written_by}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f2f3f6" }}>
                <Clock className="h-4 w-4" style={{ color: "#8993a6" }} />
              </div>
              <div>
                <p className="text-[10.5px] tracking-wider uppercase" style={{ color: "#9aa3b2" }}>
                  Read time
                </p>
                <p className="text-sm mt-0.5" style={{ color: "#101d30" }}>
                  {blog.read_time_minutes ? `${blog.read_time_minutes} min` : "Not set"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={cardStyle}>
            <p className="text-[11px] tracking-wider uppercase mb-2.5" style={{ color: "#9aa3b2" }}>
              Category
            </p>
            <span
              className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "#f2f3f6", color: "#101d30" }}
            >
              {blog.blog_category?.name || "—"}
            </span>
          </div>

          <div className="rounded-2xl p-5 text-xs space-y-1.5" style={cardStyle}>
            <p style={{ color: "#9aa3b2" }}>
              Published {new Date(blog.published_at).toLocaleDateString()}
            </p>
            <p style={{ color: "#9aa3b2" }}>
              Updated {new Date(blog.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}