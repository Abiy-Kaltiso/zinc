"use client";

import { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { api } from "@/lib/api";
import { Property, Unit } from "@/lib/types";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProperties().then((data) => {
      const props = data.results || data;
      setProperties(props);
      if (props.length > 0) {
        setSelectedProperty(props[0].id);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      api.getUnits(selectedProperty).then((data) => {
        setUnits(data.results || data);
      });
    }
  }, [selectedProperty]);

  const statusStyles: Record<string, string> = {
    owner_occupied: "bg-emerald-50 text-emerald-700",
    rented: "bg-indigo-50 text-indigo-700",
    vacant: "bg-gray-50 text-gray-500",
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Properties</h1>
          <p className="text-sm text-gray-400 mt-1">Community properties and unit registry</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {properties.map((prop) => (
              <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{prop.name}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{prop.address}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400 space-y-1">
                    <p>Min term: <span className="font-medium text-gray-600">{prop.minimum_lease_term_months}mo</span></p>
                    <p>Screening: <span className="font-medium text-gray-600">{prop.require_screening_for_approval ? "Required" : "Optional"}</span></p>
                  </div>
                </div>
              </div>
            ))}

            {selectedProperty && units.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Units</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit) => (
                      <tr key={unit.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{unit.unit_number}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{unit.address_line}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{unit.current_owner_name || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${statusStyles[unit.occupancy_status]}`}>
                            {unit.occupancy_status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {unit.bedrooms && `${unit.bedrooms}bd`}
                          {unit.bathrooms && ` / ${unit.bathrooms}ba`}
                          {unit.square_feet && ` / ${unit.square_feet}sqft`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
