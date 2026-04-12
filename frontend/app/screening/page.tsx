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
        <h1 className="text-2xl font-bold text-gray-900">Screening & Review Queue</h1>
        <p className="text-gray-600">Leases pending board review. Verify screening before approving.</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : leases.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            No leases pending review
          </div>
        ) : (
          <div className="space-y-4">
            {leases.map((lease) => (
              <div key={lease.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Lease #{lease.id} - Unit {lease.unit_number}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Tenant: {lease.tenant_full_name} | Owner: {lease.owner_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lease.lease_start_date} to {lease.lease_end_date} ({lease.term_months} months)
                      | ${Number(lease.monthly_rent).toLocaleString()}/mo
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={lease.status} />
                    <Link
                      href={`/leases/${lease.id}`}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
