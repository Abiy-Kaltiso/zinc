"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { DashboardStats, Lease } from "@/lib/types";

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 mt-2 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { isBoardMember } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeases, setRecentLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const leasesRes = await api.getLeases();
        setRecentLeases((leasesRes.results || leasesRes).slice(0, 8));

        if (isBoardMember) {
          const dashStats = await api.getDashboard();
          setStats(dashStats);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isBoardMember]);

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Overview of your lease activity</p>
          </div>
          <Link
            href="/leases/new"
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            New Lease
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {stats && isBoardMember && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Active Leases" value={stats.active_leases} />
                <StatCard label="Pending Review" value={stats.pending_reviews} />
                <StatCard label="Expiring Soon" value={stats.expiring_30_days} sub="Within 30 days" />
                <StatCard label="Rented Units" value={stats.occupancy.rented} />
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Recent Leases</h2>
                <Link href="/leases" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  View all
                </Link>
              </div>
              {recentLeases.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-gray-400">No leases yet</p>
                  <Link href="/leases/new" className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
                    Submit your first lease
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLeases.map((lease) => (
                        <tr key={lease.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{lease.unit_number}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{lease.tenant_full_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {lease.lease_start_date} &ndash; {lease.lease_end_date}
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
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
