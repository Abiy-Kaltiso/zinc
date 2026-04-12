"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { api } from "@/lib/api";

interface TenantForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export default function NewLeasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leaseFile, setLeaseFile] = useState<File | null>(null);
  const [tenants, setTenants] = useState<TenantForm[]>([
    { first_name: "", last_name: "", email: "", phone: "" },
  ]);
  const [form, setForm] = useState({
    unit_number: "",
    lease_start_date: "",
    lease_end_date: "",
    monthly_rent: "",
    lease_terms: "",
  });

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
    setLoading(true);
    try {
      const lease = await api.createLease({
        ...form,
        tenants,
      });

      // Upload lease document if provided
      if (leaseFile) {
        // Fetch the "Lease Agreement" category ID
        let categoryId = "1";
        try {
          const cats = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/documents/categories/`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
          );
          if (cats.ok) {
            const catData = await cats.json();
            const list = catData.results || catData;
            const leaseAgreement = list.find((c: { id: number; name: string }) => c.name === "Lease Agreement");
            if (leaseAgreement) categoryId = String(leaseAgreement.id);
            else if (list.length > 0) categoryId = String(list[0].id);
          }
        } catch { /* use default */ }

        const formData = new FormData();
        formData.append("file", leaseFile);
        formData.append("title", leaseFile.name);
        formData.append("category", categoryId);
        try {
          await api.uploadDocument(lease.id, formData);
        } catch (uploadErr) {
          console.error("Document upload failed:", uploadErr);
        }
      }

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
            <input
              name="unit_number"
              required
              value={form.unit_number}
              onChange={handleChange}
              placeholder="e.g., 101, 2A, Building B #305"
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
                    <button
                      type="button"
                      onClick={() => removeTenant(idx)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">First Name</label>
                    <input
                      name="first_name"
                      required
                      value={tenant.first_name}
                      onChange={(e) => handleTenantChange(idx, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                    <input
                      name="last_name"
                      required
                      value={tenant.last_name}
                      onChange={(e) => handleTenantChange(idx, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input
                      name="email"
                      type="email"
                      value={tenant.email}
                      onChange={(e) => handleTenantChange(idx, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Phone</label>
                    <input
                      name="phone"
                      value={tenant.phone}
                      onChange={(e) => handleTenantChange(idx, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addTenant}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Another Tenant
            </button>
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

          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-sm font-medium text-gray-700 px-2">Lease Document</legend>
            <p className="text-sm text-gray-500 mb-3">Upload a copy of the signed lease agreement (PDF, DOC, or image).</p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setLeaseFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {leaseFile && (
              <p className="mt-2 text-sm text-gray-600">Selected: {leaseFile.name}</p>
            )}
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
              {loading ? "Submitting..." : "Submit Lease"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
