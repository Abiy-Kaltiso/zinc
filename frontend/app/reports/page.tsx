"use client";

import { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { api } from "@/lib/api";
import { ComplianceRecord } from "@/lib/types";

export default function ReportsPage() {
  const [compliance, setCompliance] = useState<ComplianceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"compliance" | "occupancy">("compliance");
  const [occupancy, setOccupancy] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (activeTab === "compliance") {
          const data = await api.getComplianceReport();
          setCompliance(data);
        } else {
          const data = await api.getOccupancy();
          setOccupancy(data);
        }
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    load();
  }, [activeTab]);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Reports</h1>
            <p className="text-sm text-gray-400 mt-1">Compliance and occupancy analytics</p>
          </div>
          <a
            href={api.getExportUrl("csv")}
            className="px-4 py-2.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            Export CSV
          </a>
        </div>

        <div className="flex gap-1.5">
          {[
            { label: "Compliance", value: "compliance" as const },
            { label: "Occupancy", value: "occupancy" as const },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.value
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : activeTab === "compliance" ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Term OK</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Screening</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Verified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Docs</th>
                </tr>
              </thead>
              <tbody>
                {compliance.map((row) => (
                  <tr key={row.lease_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.unit_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.tenant_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.owner_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.term_months}mo</td>
                    <td className="px-6 py-4">
                      {row.term_compliant ? (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Pass</span>
                      ) : (
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md">Fail</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.screening_complete ? (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Complete</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {row.screening_verified ? (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Yes</span>
                      ) : (
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.document_count}</td>
                  </tr>
                ))}
                {compliance.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm text-gray-400">No compliance data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Lease Ends</th>
                </tr>
              </thead>
              <tbody>
                {occupancy.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{String(row.unit_number)}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {String(row.occupancy_status).replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.owner_name ? String(row.owner_name) : "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.tenant_name ? String(row.tenant_name) : "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {row.lease_end_date ? String(row.lease_end_date) : "—"}
                    </td>
                  </tr>
                ))}
                {occupancy.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-400">No occupancy data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
