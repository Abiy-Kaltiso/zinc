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

  const statusColors: Record<string, string> = {
    owner_occupied: "bg-green-100 text-green-700",
    rented: "bg-blue-100 text-blue-700",
    vacant: "bg-gray-100 text-gray-600",
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties & Units</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <>
            {properties.map((prop) => (
              <div key={prop.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{prop.name}</h2>
                    <p className="text-sm text-gray-500">{prop.address}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Min lease term: <span className="font-medium">{prop.minimum_lease_term_months} months</span></p>
                    <p>Screening required: <span className="font-medium">{prop.require_screening_for_approval ? "Yes" : "No"}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProperty(prop.id)}
                  className={`text-sm ${selectedProperty === prop.id ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {prop.unit_count} units {selectedProperty === prop.id ? "(showing)" : "(show)"}
                </button>
              </div>
            ))}

            {selectedProperty && units.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold">Units</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {units.map((unit) => (
                      <tr key={unit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{unit.unit_number}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{unit.address_line}</td>
                        <td className="px-6 py-4 text-sm">{unit.current_owner_name || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[unit.occupancy_status]}`}>
                            {unit.occupancy_status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
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
