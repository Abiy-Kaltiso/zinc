import { LeaseStatus } from "@/lib/types";

const STATUS_CONFIG: Record<LeaseStatus, { bg: string; dot: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-50", dot: "bg-gray-400", text: "text-gray-600", label: "Draft" },
  pending_review: { bg: "bg-amber-50", dot: "bg-amber-400", text: "text-amber-700", label: "Pending Review" },
  approved: { bg: "bg-blue-50", dot: "bg-blue-400", text: "text-blue-700", label: "Approved" },
  active: { bg: "bg-emerald-50", dot: "bg-emerald-400", text: "text-emerald-700", label: "Active" },
  denied: { bg: "bg-red-50", dot: "bg-red-400", text: "text-red-700", label: "Denied" },
  expired: { bg: "bg-orange-50", dot: "bg-orange-400", text: "text-orange-700", label: "Expired" },
  terminated: { bg: "bg-rose-50", dot: "bg-rose-400", text: "text-rose-700", label: "Terminated" },
};

export function StatusBadge({ status }: { status: LeaseStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
