"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { api, resolveMediaUrl } from "@/lib/api";
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

  // Attestation form state
  const [attestConfirmed, setAttestConfirmed] = useState(false);
  const [attestCompany, setAttestCompany] = useState("");
  const [attestDate, setAttestDate] = useState("");
  const [attestLoading, setAttestLoading] = useState(false);
  const [attestError, setAttestError] = useState("");

  // Communication edit state
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

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

      // Fetch screening for all statuses — backend auto-creates so owner can
      // attest while lease is still in draft.
      try {
        const screeningData = await api.getScreening(leaseId);
        setScreening(screeningData);
      } catch { /* screening may not exist yet */ }
    } catch (err) {
      console.error("Failed to load lease:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [leaseId]);

  async function handleAction(action: () => Promise<unknown>) {
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

  async function handleEditMessage(msgId: number) {
    if (!editingText.trim()) return;
    setActionLoading(true);
    try {
      await api.updateCommunication(leaseId, msgId, editingText);
      setEditingMsgId(null);
      setEditingText("");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to edit message");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteMessage(msgId: number) {
    setActionLoading(true);
    try {
      await api.deleteCommunication(leaseId, msgId);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete message");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAttest(e: React.FormEvent) {
    e.preventDefault();
    setAttestError("");
    setAttestLoading(true);
    try {
      await api.submitAttestation(leaseId, {
        confirmed: attestConfirmed,
        company: attestCompany,
        date: attestDate,
      });
      await loadData();
    } catch (err: unknown) {
      setAttestError(err instanceof Error ? err.message : "Failed to submit attestation");
    } finally {
      setAttestLoading(false);
    }
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
  const screeningRequired = true; // Could be driven by property setting later
  const hasDocuments = documents.length > 0;
  const canSubmit = hasDocuments && (!screeningRequired || screening?.owner_attested);
  const canApprove = !screeningRequired || (screening?.owner_attested && !!screening?.verified_at);

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {lease.status === "draft" && isOwner && (
              <>
                {!canSubmit && (
                  <div className="w-full mb-2 flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span>
                      Before submitting, you must:
                      <ul className="mt-1 list-disc list-inside">
                        {!hasDocuments && <li>Upload the signed lease document</li>}
                        {!screening?.owner_attested && <li>Submit the screening attestation</li>}
                      </ul>
                    </span>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/leases/${lease.id}/edit`)}
                  className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                >
                  Edit Lease
                </button>
                <button
                  onClick={() => handleAction(() => api.submitLease(lease.id))}
                  disabled={actionLoading || !canSubmit}
                  title={!canSubmit ? "Upload lease document and submit attestation first" : undefined}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {!canApprove && (
                  <div className="w-full mb-2 flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span>
                      Approval is blocked until:
                      <ul className="mt-1 list-disc list-inside">
                        {!screening?.owner_attested && <li>Owner submits the screening attestation</li>}
                        {screening?.owner_attested && !screening?.verified_at && <li>Board verifies the screening</li>}
                      </ul>
                    </span>
                  </div>
                )}
                <button
                  onClick={() => handleAction(() => api.reviewLease(lease.id, "approved", reviewComments))}
                  disabled={actionLoading || !canApprove}
                  title={!canApprove ? "Screening attestation and checks must be complete before approving" : undefined}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
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

            {["denied", "expired", "terminated", "draft"].includes(lease.status) && !isOwner && (
              <p className="text-sm text-gray-500 py-2">No actions available for this lease.</p>
            )}
          </div>
        </div>

        {/* Tenant Screening (attestation + board verification) */}
        {screening && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold">Tenant Screening</h2>
              {screening.verified_at ? (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Verified</span>
              ) : screening.owner_attested ? (
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Awaiting board verification</span>
              ) : (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Attestation required</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Step 1: Owner attests a background check was completed.
              Step 2: Board reviews the attestation and verifies. Approval is gated on both steps.
            </p>

            {/* Owner's attestation block */}
            {screening.owner_attested ? (
              <div className="space-y-2 mb-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 space-y-1 text-sm">
                  <p className="font-medium text-emerald-800">Owner attestation on file</p>
                  <p className="text-emerald-700">Screening company: <span className="font-medium">{screening.attestation_company}</span></p>
                  <p className="text-emerald-700">Date completed: <span className="font-medium">{screening.attestation_date}</span></p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Submitted {screening.owner_attested_at ? new Date(screening.owner_attested_at).toLocaleString() : ""}
                  </p>
                </div>
                {isOwner && !screening.verified_at && ["draft", "pending_review"].includes(lease.status) && (
                  <button
                    onClick={() => handleAction(() => api.retractAttestation(leaseId))}
                    disabled={actionLoading}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Retract attestation
                  </button>
                )}
              </div>
            ) : isOwner && ["draft", "pending_review"].includes(lease.status) ? (
              <form onSubmit={handleAttest} className="space-y-4 mb-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-1">Legal Notice</p>
                  <p>
                    By submitting this attestation, you confirm under penalty of HOA policy that a background and/or
                    credit check was conducted through the company listed below. Falsification of screening records
                    is subject to a <strong>$500 fine</strong> and may result in lease termination and additional
                    legal action per the HOA CC&amp;Rs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Screening Company <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={attestCompany}
                      onChange={(e) => setAttestCompany(e.target.value)}
                      placeholder="e.g. TransUnion SmartMove"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                      Date Completed <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={attestDate}
                      onChange={(e) => setAttestDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={attestConfirmed}
                    onChange={(e) => setAttestConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">
                    I confirm that a background check was completed for all tenants named on this lease,
                    and I understand that falsifying this information is subject to a $500 fine.
                  </span>
                </label>

                {attestError && (
                  <p className="text-sm text-red-600">{attestError}</p>
                )}

                <button
                  type="submit"
                  disabled={attestLoading || !attestConfirmed}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {attestLoading ? "Submitting..." : "Submit Attestation"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-400 italic mb-4">
                Awaiting owner attestation.
              </p>
            )}

            {/* Board verification block */}
            {screening.owner_attested && (
              <div className="border-t border-gray-100 pt-4">
                {screening.verified_at ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-emerald-700">
                      Board verified by <span className="font-medium">{screening.verified_by_name}</span> on {new Date(screening.verified_at).toLocaleDateString()}
                    </p>
                    {isBoardMember && (
                      <button
                        onClick={() => handleAction(() => api.unverifyScreening(leaseId))}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Undo Verification
                      </button>
                    )}
                  </div>
                ) : isBoardMember ? (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-gray-600">
                      Review the owner&apos;s attestation and any uploaded screening documents, then verify.
                    </p>
                    <button
                      onClick={() => handleAction(() => api.verifyScreening(leaseId))}
                      disabled={actionLoading}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      Verify Screening
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Awaiting board verification.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                    href={resolveMediaUrl(doc.file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700"
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
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Upload
              </button>
            )}
          </div>
        </div>

        {/* Review History */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Communication</h2>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {communications.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet</p>
            ) : (
              communications.map((msg) => {
                const isMyMessage = user?.id === msg.sender;
                const isEditing = editingMsgId === msg.id;

                return (
                  <div key={msg.id} className="bg-gray-50 rounded-lg p-3 group">
                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{msg.sender_name}</span>
                        <span className="capitalize">({msg.sender_role.replace("_", " ")})</span>
                        <span>{new Date(msg.created_at).toLocaleString()}</span>
                        {msg.updated_at !== msg.created_at && (
                          <span className="text-gray-400 italic">(edited)</span>
                        )}
                      </div>
                      {isMyMessage && !isEditing && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingMsgId(msg.id); setEditingText(msg.message); }}
                            className="text-indigo-500 hover:text-indigo-700 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          autoFocus
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditMessage(msg.id);
                            if (e.key === "Escape") { setEditingMsgId(null); setEditingText(""); }
                          }}
                        />
                        <button onClick={() => handleEditMessage(msg.id)} className="text-xs text-indigo-600 font-medium">Save</button>
                        <button onClick={() => { setEditingMsgId(null); setEditingText(""); }} className="text-xs text-gray-500">Cancel</button>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm">{msg.message}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
