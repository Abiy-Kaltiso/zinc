"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { Lease } from "@/lib/types";

export default function ScreeningPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getLeases({ status: "pending_review" });
        setLeases(data.results || data);
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Screening & Review</h1>
          <p className="text-sm text-gray-400 mt-1">Leases pending board review and screening verification</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : leases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-16 text-center">
            <p className="text-sm text-gray-400">No leases pending review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leases.map((lease) => (
              <div key={lease.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Unit {lease.unit_number}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Tenant: {lease.tenant_full_name} &middot; Owner: {lease.owner_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {lease.lease_start_date} &ndash; {lease.lease_end_date} ({lease.term_months}mo)
                      &middot; ${Number(lease.monthly_rent).toLocaleString()}/mo
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={lease.status} />
                    <Link
                      href={`/leases/${lease.id}`}
                      className="px-4 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
