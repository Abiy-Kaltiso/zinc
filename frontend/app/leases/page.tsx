"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Lease } from "@/lib/types";

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

  const statuses = isBoardMember
    ? [
        { label: "All", value: "all" },
        { label: "Pending Review", value: "pending_review" },
        { label: "Approved", value: "approved" },
        { label: "Active", value: "active" },
        { label: "Denied", value: "denied" },
        { label: "Expired", value: "expired" },
        { label: "Terminated", value: "terminated" },
      ]
    : [
        { label: "All", value: "all" },
        { label: "Draft", value: "draft" },
        { label: "Pending Review", value: "pending_review" },
        { label: "Approved", value: "approved" },
        { label: "Active", value: "active" },
        { label: "Denied", value: "denied" },
        { label: "Expired", value: "expired" },
      ];

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {isBoardMember ? "Leases" : "My Leases"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {isBoardMember ? "All submitted leases across the community" : "Manage your lease submissions"}
            </p>
          </div>
          {!isBoardMember && (
            <Link
              href="/leases/new"
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              New Lease
            </Link>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setLoading(true); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                statusFilter === s.value
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : leases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-16 text-center">
            <p className="text-sm text-gray-400">No leases found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unit</th>
                  {isBoardMember && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{lease.unit_number}</td>
                    {isBoardMember && (
                      <td className="px-6 py-4 text-sm text-gray-600">{lease.owner_name}</td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600">{lease.tenant_full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {lease.lease_start_date} &ndash; {lease.lease_end_date}
                      <span className="block text-xs">{lease.term_months}mo</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${Number(lease.monthly_rent).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lease.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/leases/${lease.id}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
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
