import { LeaseStatus } from "@/lib/types";

const STATUS_STYLES: Record<LeaseStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800",
  terminated: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<LeaseStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  active: "Active",
  denied: "Denied",
  expired: "Expired",
  terminated: "Terminated",
};

export function StatusBadge({ status }: { status: LeaseStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
