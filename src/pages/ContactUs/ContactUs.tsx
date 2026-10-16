/** @format */

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Inbox,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { GetAllContactUsAPI, DeleteContactUsAPI } from "@/services/Api/ContactUsApi";

const ITEMS_PER_PAGE = 100;

interface ContactInquiry {
  id: number;
  name?: string;
  email?: string;
  mobile?: string;
  reason?: string;
  message?: string;
  created_at?: string;
}

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
};

const formatDate = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ContactUsPage = () => {
  const { toast } = useToast();

  const [allContacts, setAllContacts] = useState<ContactInquiry[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewTarget, setViewTarget] = useState<ContactInquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactInquiry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GetAllContactUsAPI();
      setAllContacts(res.data.data || []);
    } catch (err: any) {
      toast({
        title: "Failed to load inquiries",
        description: err.response?.data?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allContacts;

    return allContacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.reason?.toLowerCase().includes(q),
    );
  }, [allContacts, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / ITEMS_PER_PAGE));

  const pagedContacts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredContacts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContacts, page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await DeleteContactUsAPI(deleteTarget.id);
      setAllContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({
        title: "Inquiry deleted",
        description: "The contact inquiry has been deleted successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.response?.data?.message || "Unable to delete inquiry.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const details = viewTarget
    ? [
        { icon: User, label: "Name", value: viewTarget.name },
        { icon: Mail, label: "Email", value: viewTarget.email },
        { icon: Phone, label: "Mobile", value: viewTarget.mobile || "—" },
        { icon: MessageSquare, label: "Reason", value: viewTarget.reason },
        { icon: Calendar, label: "Received", value: formatDate(viewTarget.created_at) },
      ]
    : [];

  return (
    <div className="w-full px-6 py-6 md:px-8 md:py-8">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-[20px] font-semibold text-navy">
          <Inbox className="h-5 w-5 text-gold" />
          Contact Us
        </h1>
        <p className="text-sm mt-1 text-ink-muted">Manage customer inquiries.</p>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white border border-line shadow-card">
        <div className="px-5 py-4 border-b border-line-soft">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <Input
              placeholder="Search by name, email or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg pl-9 pr-8 text-[13.5px]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted border-b border-line-soft">
                {["#", "Contact", "Mobile", "Reason", "Date", ""].map((h, i) => (
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
              ) : pagedContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-ink-faint">
                    No inquiries found.
                  </td>
                </tr>
              ) : (
                pagedContacts.map((c, idx) => (
                  <tr key={c.id} className="bg-white even:bg-surface-subtle">
                    <td className="px-5 py-3 tabular-nums text-ink-faint">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-gold-soft text-gold-dark text-xs font-semibold">
                          {getInitials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-navy">{c.name}</p>
                          <p className="text-xs text-ink-faint">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{c.mobile || "—"}</td>
                    <td className="px-5 py-3 max-w-[220px] truncate text-ink-muted">{c.reason}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-ink-muted">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewTarget(c)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-ink-subtle hover:bg-fill"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors text-danger hover:bg-danger-soft"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-line-soft">
          <span className="text-[12.5px] text-ink-faint">
            {filteredContacts.length} inquir{filteredContacts.length !== 1 ? "ies" : "y"} total
          </span>
          <div className="flex items-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-40 border border-line text-ink-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[12.5px] text-ink-muted">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg disabled:opacity-40 border border-line text-ink-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {viewTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4 bg-navy/45 z-[100000]"
          onClick={() => setViewTarget(null)}
        >
          <div
            className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between px-6 py-5 bg-white border-b border-line-soft">
              <h3 className="text-[16px] font-semibold text-navy">Contact inquiry</h3>
              <button onClick={() => setViewTarget(null)} className="text-ink-faint">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-fill">
                    <Icon className="h-4 w-4 text-ink-subtle" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10.5px] tracking-wider uppercase text-ink-faint">{label}</p>
                    <p className="text-sm mt-0.5 break-words text-navy">{value}</p>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-line-soft">
                <p className="text-[10.5px] tracking-wider uppercase mb-2 text-ink-faint">Customer message</p>
                <div className="rounded-lg p-4 whitespace-pre-wrap leading-relaxed text-sm bg-surface-muted border border-line text-prose">
                  {viewTarget.message}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end">
              <button
                onClick={() => setViewTarget(null)}
                className="h-10 px-5 rounded-lg text-sm font-medium bg-fill text-navy"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4 bg-navy/45 z-[100000]"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div className="w-full max-w-sm rounded-2xl p-6 bg-white shadow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="h-10 w-10 rounded-full flex items-center justify-center mb-3 bg-danger-soft">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <h3 className="text-[16px] font-semibold text-navy">Delete inquiry?</h3>
            <p className="text-sm mt-1.5 text-ink-muted">
              This will permanently remove the inquiry from{" "}
              <span className="text-navy font-medium">"{deleteTarget.name || deleteTarget.email}"</span>. This can't be
              undone.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg text-sm font-medium disabled:opacity-50 bg-fill text-navy"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70 bg-danger text-white"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUsPage;
