/** @format */
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, ClipboardList, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GetBusinessSubmissionsAPI } from "@/services/Api/BusinessSubmissionApi";
import { cn } from "@/lib/utils";

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

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
};

export default function BusinessRequests() {
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
        <h1 className="flex items-center gap-2 text-[20px] font-semibold text-navy">
          <ClipboardList className="h-5 w-5 text-gold" />
          Business Requests
        </h1>
        <p className="text-sm mt-1 text-ink-muted">
          Businesses that have submitted a request to be listed.
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden bg-white border border-line shadow-card"
      >
        <div className="px-5 py-4 border-b border-line-soft">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <Input
              placeholder="Search by business, contact, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 text-[13.5px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted border-b border-line-soft">
                {["Business", "Contact", "Plan", "Amount", "Status", "Submitted"].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wider text-ink-subtle"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-ink-faint" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-ink-faint">
                    No business requests found.
                  </td>
                </tr>
              ) : (
                paginated.map((sub) => (
                  <tr key={sub.id} className="bg-white even:bg-surface-subtle">
                    <td className="px-5 py-3 font-medium max-w-[220px] truncate text-navy">
                      {sub.business_name}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      <div>{sub.contact_name}</div>
                      <div className="text-xs text-ink-faint">
                        {sub.email}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {sub.plan.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3 text-navy">
                      ${sub.amount}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-block px-2.5 py-1 rounded-full text-[11px] font-medium capitalize",
                          STATUS_BADGE[sub.status] ?? "bg-gold-soft text-gold-dark",
                        )}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-line-soft">
            <p className="text-xs text-ink-faint">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-40 text-ink-muted border border-line"
              >
                Previous
              </button>
              <span className="text-xs text-ink-faint">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-40 text-ink-muted border border-line"
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