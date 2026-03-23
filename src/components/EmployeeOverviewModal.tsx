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
      <div className="bg-card border border-border rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Employee Overview</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : overview ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Employee ID
              </label>
              <p className="text-foreground bg-background border border-border p-2 rounded text-sm">
                {overview.empID || "Not available"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Name
              </label>
              <p className="text-foreground bg-background border border-border p-2 rounded text-sm">
                {overview.name || "Not available"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email
              </label>
              <p className="text-foreground bg-background border border-border p-2 rounded text-sm">
                {employeeEmail}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No overview data available</p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted rounded hover:bg-muted/80 text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}