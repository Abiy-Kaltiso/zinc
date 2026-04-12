"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { api } from "@/lib/api";
import { Unit } from "@/lib/types";

export default function NewLeasePage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    unit: "",
    tenant_first_name: "",
    tenant_last_name: "",
    tenant_email: "",
    tenant_phone: "",
    lease_start_date: "",
    lease_end_date: "",
    monthly_rent: "",
    lease_terms: "",
  });

  useEffect(() => {
    api.getMyUnits().then((data) => {
      setUnits(data.results || data);
    }).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const lease = await api.createLease({
        ...form,
        unit: Number(form.unit),
      });
      router.push(`/leases/${lease.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create lease");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit New Lease</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              name="unit"
              required
              value={form.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a unit...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.unit_number} - {u.address_line}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">Tenant Information</legend>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">First Name</label>
                <input
                  name="tenant_first_name"
                  required
                  value={form.tenant_first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                <input
                  name="tenant_last_name"
                  required
                  value={form.tenant_last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  name="tenant_email"
                  type="email"
                  value={form.tenant_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <input
                  name="tenant_phone"
                  value={form.tenant_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">Lease Terms</legend>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  name="lease_start_date"
                  type="date"
                  required
                  value={form.lease_start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  name="lease_end_date"
                  type="date"
                  required
                  value={form.lease_end_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Monthly Rent ($)</label>
                <input
                  name="monthly_rent"
                  type="number"
                  step="0.01"
                  required
                  value={form.monthly_rent}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">Additional Terms / Notes</label>
              <textarea
                name="lease_terms"
                rows={3}
                value={form.lease_terms}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </fieldset>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Draft Lease"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
