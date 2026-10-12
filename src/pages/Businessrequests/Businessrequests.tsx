/** @format */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Eye, ClipboardList, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetBusinessSubmissionsAPI } from "@/services/Api/BusinessSubmissionApi";

const LIMIT = 15;

interface BusinessSubmission {
  id: number;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website?: string;
  plan: string;
  amount: string;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
}

const inputStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5eb",
  color: "#101d30",
};

const statusStyle = (status: string) => {
  switch (status) {
    case "approved":
      return { background: "#e7f5ea", color: "#3f9d5c" };
    case "rejected":
      return { background: "#fbeceb", color: "#c25b4a" };
    case "pending":
    default:
      return { background: "#fbf3de", color: "#a3874f" };
  }
};

export default function BusinessRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await GetBusinessSubmissionsAPI(token);
      if (res.data?.success) {
        setSubmissions(res.data?.data || []);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load business requests",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      submissions.filter(
        (s) =>
          s.business_name.toLowerCase().includes(search.toLowerCase()) ||
          s.contact_name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
      ),
    [submissions, search]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-[20px] font-semibold" style={{ color: "#101d30" }}>
          <ClipboardList className="h-5 w-5" style={{ color: "#c9a227" }} />
          Business Requests
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6b7688" }}>
          Businesses that have submitted a request to be listed.
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #e2e5eb", boxShadow: "0 1px 3px rgba(16,29,48,0.06)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #edeff3" }}>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9aa3b2" }} />
            <Input
              placeholder="Search by business, contact, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 text-[13.5px]"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #edeff3" }}>
                {["Business", "Contact", "Plan", "Amount", "Status", "Submitted", ""].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wider"
                    style={{ color: "#8993a6" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: "#9aa3b2" }} />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-sm" style={{ color: "#9aa3b2" }}>
                    No business requests found.
                  </td>
                </tr>
              ) : (
                paginated.map((sub, idx) => (
                  <tr key={sub.id} style={{ background: idx % 2 === 1 ? "#fafbfc" : "#ffffff" }}>
                    <td className="px-5 py-3 font-medium max-w-[220px] truncate" style={{ color: "#101d30" }}>
                      {sub.business_name}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      <div>{sub.contact_name}</div>
                      <div className="text-xs" style={{ color: "#9aa3b2" }}>
                        {sub.email}
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      {sub.plan.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#101d30" }}>
                      ${sub.amount}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium capitalize"
                        style={statusStyle(sub.status)}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7688" }}>
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                    {/* <td className="px-5 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => navigate(`/business-requests/${sub.id}`)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: "#8993a6" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f3f6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #edeff3" }}>
            <p className="text-xs" style={{ color: "#9aa3b2" }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ color: "#6b7688", border: "1px solid #e2e5eb" }}
              >
                Previous
              </button>
              <span className="text-xs" style={{ color: "#9aa3b2" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-40"
                style={{ color: "#6b7688", border: "1px solid #e2e5eb" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}