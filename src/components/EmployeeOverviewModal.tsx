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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 max-w-[90vw] rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Employee Overview</h2>
          <button
            onClick={onClose}
            className="text-2xl text-muted-foreground transition-colors hover:text-foreground"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : overview ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Employee ID
              </label>
              <p className="rounded-md border border-border bg-background p-2 text-sm text-foreground">
                {overview.empID || "Not available"}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="rounded-md border border-border bg-background p-2 text-sm text-foreground">
                {overview.name || "Not available"}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="rounded-md border border-border bg-background p-2 text-sm text-foreground">
                {employeeEmail}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No overview data available</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
