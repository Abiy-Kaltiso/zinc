"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Lease, LeaseStatus } from "@/lib/types";

export default function LeasesPage() {
  const { isBoardMember } = useAuth();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      try {
        const params: Record<string, string> = {};
        if (statusFilter !== "all") params.status = statusFilter;
        const data = await api.getLeases(params);
        setLeases(data.results || data);
      } catch (err) {
        console.error("Failed to load leases:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  const statuses: { label: string; value: string }[] = [
    { label: "All", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Pending Review", value: "pending_review" },
    { label: "Approved", value: "approved" },
    { label: "Active", value: "active" },
    { label: "Denied", value: "denied" },
    { label: "Expired", value: "expired" },
    { label: "Terminated", value: "terminated" },
  ];

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {isBoardMember ? "All Leases" : "My Leases"}
          </h1>
          <Link
            href="/leases/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + New Lease
          </Link>
        </div>

        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setLoading(true); }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === s.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : leases.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            No leases found
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  {isBoardMember && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">#{lease.id}</td>
                    <td className="px-6 py-4 text-sm font-medium">{lease.unit_number}</td>
                    {isBoardMember && (
                      <td className="px-6 py-4 text-sm">{lease.owner_name}</td>
                    )}
                    <td className="px-6 py-4 text-sm">{lease.tenant_full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {lease.lease_start_date} to {lease.lease_end_date}
                      <br />
                      <span className="text-xs">{lease.term_months} months</span>
                    </td>
                    <td className="px-6 py-4 text-sm">${Number(lease.monthly_rent).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lease.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/leases/${lease.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
