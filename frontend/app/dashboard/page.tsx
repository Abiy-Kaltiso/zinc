"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { DashboardStats, Lease } from "@/lib/types";

function StatCard({ label, value, color = "blue" }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className={`p-6 rounded-lg border ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
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
        const [leasesRes] = await Promise.all([
          api.getLeases(),
        ]);
        setRecentLeases((leasesRes.results || leasesRes).slice(0, 10));

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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Link
            href="/leases/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + New Lease
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <>
            {stats && isBoardMember && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Active Leases" value={stats.active_leases} color="green" />
                <StatCard label="Pending Reviews" value={stats.pending_reviews} color="yellow" />
                <StatCard label="Expiring in 30 Days" value={stats.expiring_30_days} color="red" />
                <StatCard label="Total Units" value={stats.occupancy.total} color="blue" />
              </div>
            )}

            {stats && isBoardMember && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Occupancy Overview</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.occupancy.owner_occupied}</p>
                    <p className="text-sm text-gray-500">Owner Occupied</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.occupancy.rented}</p>
                    <p className="text-sm text-gray-500">Rented</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">{stats.occupancy.vacant}</p>
                    <p className="text-sm text-gray-500">Vacant</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Recent Leases</h2>
              </div>
              {recentLeases.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No leases yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentLeases.map((lease) => (
                        <tr key={lease.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium">{lease.unit_number}</td>
                          <td className="px-6 py-4 text-sm">{lease.tenant_full_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {lease.lease_start_date} to {lease.lease_end_date}
                          </td>
                          <td className="px-6 py-4 text-sm">${Number(lease.monthly_rent).toLocaleString()}/mo</td>
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
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
