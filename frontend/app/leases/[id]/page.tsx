"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Lease, LeaseReview, ScreeningRecord, CommunicationLog, Document } from "@/lib/types";

export default function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isBoardMember } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [reviews, setReviews] = useState<LeaseReview[]>([]);
  const [screening, setScreening] = useState<ScreeningRecord | null>(null);
  const [communications, setCommunications] = useState<CommunicationLog[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewComments, setReviewComments] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const leaseId = Number(id);

  async function loadData() {
    try {
      const [leaseData, reviewsData, commsData, docsData] = await Promise.all([
        api.getLease(leaseId),
        api.getLeaseReviews(leaseId).catch(() => ({ results: [] })),
        api.getCommunications(leaseId).catch(() => ({ results: [] })),
        api.getLeaseDocuments(leaseId).catch(() => ({ results: [] })),
      ]);
      setLease(leaseData);
      setReviews(reviewsData.results || reviewsData);
      setCommunications(commsData.results || commsData);
      setDocuments(docsData.results || docsData);

      if (leaseData.status !== "draft") {
        try {
          const screeningData = await api.getScreening(leaseId);
          setScreening(screeningData);
        } catch { /* screening may not exist yet */ }
      }
    } catch (err) {
      console.error("Failed to load lease:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [leaseId]);

  async function handleAction(action: () => Promise<unknown>, successMsg?: string) {
    setError("");
    setActionLoading(true);
    try {
      await action();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim()) return;
    await handleAction(async () => {
      await api.sendCommunication(leaseId, newMessage);
      setNewMessage("");
    });
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </ProtectedLayout>
    );
  }

  if (!lease) return null;

  const isOwner = user?.id === lease.owner;

  return (
    <ProtectedLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">
              &larr; Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Lease #{lease.id} - Unit {lease.unit_number}
            </h1>
          </div>
          <StatusBadge status={lease.status} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>
        )}

        {/* Lease Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Lease Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Tenant(s)</p>
              {lease.tenants && lease.tenants.length > 0 ? (
                lease.tenants.map((tenant, idx) => (
                  <div key={idx} className={idx > 0 ? "mt-2 pt-2 border-t border-gray-100" : ""}>
                    <p className="font-medium">{tenant.first_name} {tenant.last_name}</p>
                    {tenant.email && <p className="text-sm text-gray-500">{tenant.email}</p>}
                    {tenant.phone && <p className="text-sm text-gray-500">{tenant.phone}</p>}
                  </div>
                ))
              ) : (
                <p className="font-medium">{lease.tenant_full_name || "—"}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Owner</p>
              <p className="font-medium">{lease.owner_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Rent</p>
              <p className="font-medium">${Number(lease.monthly_rent).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium">{lease.lease_start_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-medium">{lease.lease_end_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Term</p>
              <p className="font-medium">{lease.term_months} months</p>
            </div>
            {lease.days_until_expiration !== null && lease.status === "active" && (
              <div>
                <p className="text-sm text-gray-500">Days Until Expiration</p>
                <p className={`font-medium ${lease.days_until_expiration <= 30 ? "text-red-600" : lease.days_until_expiration <= 60 ? "text-yellow-600" : "text-green-600"}`}>
                  {lease.days_until_expiration} days
                </p>
              </div>
            )}
          </div>
          {lease.lease_terms && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Terms / Notes</p>
              <p className="mt-1 text-sm">{lease.lease_terms}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {lease.status === "draft" && isOwner && (
              <>
                <button
                  onClick={() => router.push(`/leases/${lease.id}/edit`)}
                  className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                >
                  Edit Lease
                </button>
                <button
                  onClick={() => handleAction(() => api.submitLease(lease.id))}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit for Review
                </button>
              </>
            )}

            {lease.status === "pending_review" && isBoardMember && (
              <>
                <div className="w-full mb-2">
                  <textarea
                    placeholder="Review comments (optional)..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleAction(() => api.reviewLease(lease.id, "approved", reviewComments))}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(() => api.reviewLease(lease.id, "denied", reviewComments))}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Deny
                </button>
                <button
                  onClick={() => handleAction(() => api.reviewLease(lease.id, "returned", reviewComments))}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                >
                  Return for Revision
                </button>
              </>
            )}

            {lease.status === "approved" && isBoardMember && (
              <button
                onClick={() => handleAction(() => api.activateLease(lease.id))}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Activate Lease
              </button>
            )}

            {(lease.status === "active" || lease.status === "approved") && isBoardMember && (
              <button
                onClick={() => handleAction(() => api.terminateLease(lease.id, "Board decision"))}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Terminate Lease
              </button>
            )}

            {["denied", "expired", "terminated", "draft"].includes(lease.status) && (
              <p className="text-sm text-gray-500 py-2">
                {lease.status === "draft" ? "This lease is in draft. Submit it for board review when ready." : "No actions available for this lease."}
              </p>
            )}
          </div>
        </div>

        {/* Screening Status */}
        {screening && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Screening Status</h2>
              {screening.all_checks_completed ? (
                <span className="text-green-600 text-sm font-medium">All checks complete</span>
              ) : (
                <span className="text-yellow-600 text-sm font-medium">Checks pending</span>
              )}
            </div>
            <div className="space-y-3">
              {screening.check_results.map((check) => (
                <div key={check.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{check.checklist_item_name}</p>
                    {check.is_required && <span className="text-xs text-red-500">Required</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      check.status === "completed" ? "bg-green-100 text-green-700" :
                      check.status === "waived" ? "bg-gray-100 text-gray-600" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {check.status}
                    </span>
                    {isBoardMember && check.status === "pending" && (
                      <button
                        onClick={() => handleAction(() => api.updateScreeningCheck(leaseId, check.id, { status: "completed" }))}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isBoardMember && !screening.verified_at && (
              <button
                onClick={() => handleAction(() => api.verifyScreening(leaseId))}
                disabled={actionLoading}
                className="mt-4 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Verify All Screening Complete
              </button>
            )}
            {screening.verified_at && (
              <p className="mt-4 text-sm text-green-600">
                Verified by {screening.verified_by_name} on {new Date(screening.verified_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Documents</h2>
          {documents.length > 0 ? (
            <div className="space-y-3 mb-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-gray-500">
                      {doc.category_name} &middot; {(doc.file_size / 1024).toFixed(0)} KB &middot; Uploaded by {doc.uploaded_by_name} &middot; {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={doc.file.startsWith("http") ? doc.file : `http://localhost:8000${doc.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No documents uploaded</p>
          )}
          <div className="flex items-center gap-3">
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadFile && (
              <button
                onClick={async () => {
                  const formData = new FormData();
                  formData.append("file", uploadFile);
                  formData.append("title", uploadFile.name);
                  // Fetch category
                  try {
                    const cats = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/documents/categories/`,
                      { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
                    );
                    if (cats.ok) {
                      const catData = await cats.json();
                      const list = catData.results || catData;
                      formData.append("category", String(list[0]?.id || 1));
                    }
                  } catch { formData.append("category", "1"); }
                  await handleAction(async () => {
                    await api.uploadDocument(leaseId, formData);
                    setUploadFile(null);
                  });
                }}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Upload
              </button>
            )}
          </div>
        </div>

        {/* Review History */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Review History</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-l-4 pl-4 py-2 border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      review.decision === "approved" ? "text-green-600" :
                      review.decision === "denied" ? "text-red-600" :
                      "text-yellow-600"
                    }`}>
                      {review.decision.charAt(0).toUpperCase() + review.decision.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">by {review.reviewer_name}</span>
                    <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleString()}</span>
                  </div>
                  {review.comments && <p className="mt-1 text-sm text-gray-600">{review.comments}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communication */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Communication</h2>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {communications.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet</p>
            ) : (
              communications.map((msg) => (
                <div key={msg.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{msg.sender_name}</span>
                    <span className="capitalize">({msg.sender_role.replace("_", " ")})</span>
                    <span>{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm">{msg.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || actionLoading}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
