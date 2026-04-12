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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <a
            href={api.getExportUrl("csv")}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Export CSV
          </a>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("compliance")}
            className={`px-4 py-2 text-sm rounded-lg ${
              activeTab === "compliance" ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            Compliance Report
          </button>
          <button
            onClick={() => setActiveTab("occupancy")}
            className={`px-4 py-2 text-sm rounded-lg ${
              activeTab === "occupancy" ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-700"
            }`}
          >
            Occupancy Overview
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : activeTab === "compliance" ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term OK</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Screening</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {compliance.map((row) => (
                  <tr key={row.lease_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{row.unit_number}</td>
                    <td className="px-6 py-4 text-sm">{row.tenant_name}</td>
                    <td className="px-6 py-4 text-sm">{row.owner_name}</td>
                    <td className="px-6 py-4 text-sm">{row.term_months} mo</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${row.term_compliant ? "text-green-600" : "text-red-600"}`}>
                        {row.term_compliant ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${row.screening_complete ? "text-green-600" : "text-yellow-600"}`}>
                        {row.screening_complete ? "Complete" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${row.screening_verified ? "text-green-600" : "text-gray-400"}`}>
                        {row.screening_verified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{row.document_count}</td>
                  </tr>
                ))}
                {compliance.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No compliance data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease Ends</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {occupancy.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{String(row.unit_number)}</td>
                    <td className="px-6 py-4 text-sm">{String(row.property)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        row.occupancy_status === "rented" ? "bg-blue-100 text-blue-700" :
                        row.occupancy_status === "vacant" ? "bg-gray-100 text-gray-600" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {String(row.occupancy_status).replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{row.owner_name ? String(row.owner_name) : "—"}</td>
                    <td className="px-6 py-4 text-sm">{row.tenant_name ? String(row.tenant_name) : "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {row.lease_end_date ? String(row.lease_end_date) : "—"}
                    </td>
                  </tr>
                ))}
                {occupancy.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No occupancy data</td>
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
