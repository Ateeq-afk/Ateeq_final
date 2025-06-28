import React, { useEffect, useState } from 'react';

interface Warehouse {
  id: number;
  name: string;
  branchId?: number | null;
  address?: string;
  city?: string;
  status?: string;
}

async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await fetch('/warehouses');
  if (!res.ok) {
    throw new Error('Failed to load warehouses');
  }
  return res.json();
}

export default function WarehouseManagementPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchWarehouses()
      .then(data => setWarehouses(data))
      .catch(err => {
        console.error(err);
        setError('Failed to load warehouses');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Warehouse Management</h1>
      </div>
      {loading && <p>Loading...</p>}
      {error && (
        <p className="text-red-600" data-testid="warehouse-error">{error}</p>
      )}
      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {warehouses.length === 0 ? (
            <p className="p-4">No warehouses found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    City
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {warehouses.map(w => (
                  <tr key={w.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{w.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{w.city}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{w.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
