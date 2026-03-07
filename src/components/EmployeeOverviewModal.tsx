"use client";

import { useState, useEffect } from "react";
import { getEmployeeOverview } from "@/lib/api";
import { useToast } from "@/components/providers/toast";

interface EmployeeOverviewModalProps {
  employeeId: string;
  employeeEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeOverviewModal({
  employeeId,
  employeeEmail,
  isOpen,
  onClose
}: EmployeeOverviewModalProps) {
  const [overview, setOverview] = useState<{ empID: string | null; name: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && employeeEmail) {
      loadOverview();
    }
  }, [isOpen, employeeEmail]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await getEmployeeOverview(employeeEmail);
      // Transform undefined to null for consistency
      setOverview({
        empID: data.empID,
        name: data.name ?? null
      });
    } catch (err) {
      console.error("Failed to load employee overview", err);
      addToast("Failed to load employee overview", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Employee Overview</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-white/70">Loading...</p>
          </div>
        ) : overview ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Employee ID
              </label>
              <p className="text-white bg-[#2a2a2a] p-2 rounded">
                {overview.empID || "Not available"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Name
              </label>
              <p className="text-white bg-[#2a2a2a] p-2 rounded">
                {overview.name || "Not available"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Email
              </label>
              <p className="text-white bg-[#2a2a2a] p-2 rounded">
                {employeeEmail}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/70">No overview data available</p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}