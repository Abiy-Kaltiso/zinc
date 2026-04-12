"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { api } from "@/lib/api";
import { Lease, Tenant } from "@/lib/types";

interface TenantForm {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function EditLeasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const leaseId = Number(id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState<TenantForm[]>([]);
  const [form, setForm] = useState({
    unit_number: "",
    lease_start_date: "",
    lease_end_date: "",
    monthly_rent: "",
    lease_terms: "",
  });

  useEffect(() => {
    api.getLease(leaseId).then((lease: Lease) => {
      setForm({
        unit_number: lease.unit_number,
        lease_start_date: lease.lease_start_date,
        lease_end_date: lease.lease_end_date,
        monthly_rent: lease.monthly_rent,
        lease_terms: lease.lease_terms || "",
      });
      setTenants(
        lease.tenants?.length > 0
          ? lease.tenants.map((t: Tenant) => ({
              id: t.id,
              first_name: t.first_name,
              last_name: t.last_name,
              email: t.email || "",
              phone: t.phone || "",
            }))
          : [{ first_name: "", last_name: "", email: "", phone: "" }]
      );
    }).finally(() => setLoading(false));
  }, [leaseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTenantChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...tenants];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    setTenants(updated);
  };

  const addTenant = () => {
    setTenants([...tenants, { first_name: "", last_name: "", email: "", phone: "" }]);
  };

  const removeTenant = (index: number) => {
    setTenants(tenants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.updateLease(leaseId, { ...form, tenants });
      router.push(`/leases/${leaseId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update lease");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Lease #{leaseId}</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
            <input
              name="unit_number"
              required
              value={form.unit_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">Tenant Information</legend>
            {tenants.map((tenant, idx) => (
              <div key={idx} className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-600">Tenant {idx + 1}</h3>
                  {tenants.length > 1 && (
                    <button type="button" onClick={() => removeTenant(idx)} className="text-sm text-red-600 hover:text-red-700">
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">First Name</label>
                    <input name="first_name" required value={tenant.first_name} onChange={(e) => handleTenantChange(idx, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                    <input name="last_name" required value={tenant.last_name} onChange={(e) => handleTenantChange(idx, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input name="email" type="email" value={tenant.email} onChange={(e) => handleTenantChange(idx, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Phone</label>
                    <input name="phone" value={tenant.phone} onChange={(e) => handleTenantChange(idx, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addTenant} className="mt-2 text-sm text-blue-600 hover:text-blue-700">
              + Add Another Tenant
            </button>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">Lease Terms</legend>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input name="lease_start_date" type="date" required value={form.lease_start_date} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input name="lease_end_date" type="date" required value={form.lease_end_date} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Monthly Rent ($)</label>
                <input name="monthly_rent" type="number" step="0.01" required value={form.monthly_rent} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">Additional Terms / Notes</label>
              <textarea name="lease_terms" rows={3} value={form.lease_terms} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </fieldset>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => router.back()}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
