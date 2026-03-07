"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { dropInvite } from "@/lib/api";
import { useToast } from "@/components/providers/toast";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Employee = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  hasManager: boolean;
  empId: string | null;
};
type ManagerEmployeeRow = {
  employee_id: string;
  manager_id: string | null;
};

export default function EmployeesPage() {
  const router = useRouter();
  const { orgId } = useParams<{ orgId: string }>();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
    async function loadEmployees() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  setCurrentUserId(user?.id ?? null);

  setLoading(true);

  const { data, error } = await supabase
    .from("org_members")
    .select(`
      user_id,
      profiles!org_members_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("organization_id", orgId);

  if (error) {
    console.error(error);
    setLoading(false);
    return;
  }

  const rows = (data ?? []) as {
    user_id: string;
    profiles: Profile | null;
  }[];

  const employeeIds = rows
    .filter(r => r.profiles !== null)
    .map(r => r.profiles!.id);

  // TEMP cast until Supabase types include manager_employees



const { data: managerData, error: managerError } = await supabase
  .from("manager_employees")
  .select("employee_id, manager_id")
  .in("employee_id", employeeIds)
  .returns<ManagerEmployeeRow[]>();

if (managerError) {
  console.error(managerError);
}

const managerMap = new Map(
  (managerData ?? []).map(row => [row.employee_id, row])
);
  

  const formatted: Employee[] = rows
    .filter(r => r.profiles !== null)
    .map(r => {
      const profile = r.profiles!;
      const managerInfo = managerMap.get(profile.id);

      return {
        id: profile.id,
        full_name: profile.full_name ?? "Unnamed",
        avatar_url: profile.avatar_url,
        role: "member",
        hasManager: !!managerInfo,
        empId: managerInfo?.employee_id ?? null
      };
    });

  setEmployees(formatted);
  setLoading(false);
}

    loadEmployees();
  }, [orgId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen(null);
    };

    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownOpen]);

  function openEmployee(id: string) {
    router.push(`/organizations/${orgId}/employees/${id}`);
  }

  async function handleDropInvite(employee: Employee) {
    if (!employee.hasManager) return;
    if (!currentUserId) {
      addToast("Session expired. Please login again.", "error");
      return;
    }

    try {
      setActionLoading(employee.id);
      await dropInvite({
        employee_id: employee.id,
        manager_id: currentUserId,
      });

      // Update local state
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === employee.id ? { ...emp, hasManager: false } : emp
        )
      );

      addToast("Manager assignment removed successfully!", "success");
    } catch (err) {
      console.error("Failed to remove manager assignment", err);
      addToast("Failed to remove manager assignment", "error");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl mb-4">Employees</h1>

      {loading && <p>Loading...</p>}

      {!loading && employees.length === 0 && (
        <p>No employees found</p>
      )}

      {!loading &&
        employees.map(emp => (
          <div
            key={emp.id}
            className="p-3 bg-[#1e1e1e] rounded mb-2 cursor-pointer hover:bg-[#2a2a2a] flex justify-between items-center relative"
          >
            <div onClick={() => openEmployee(emp.id)}>
              {emp.full_name}
              {emp.hasManager && (
                <span className="ml-2 text-sm text-green-400">✓ Has Manager</span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(dropdownOpen === emp.id ? null : emp.id);
                }}
                className="px-2 py-1 text-white/70 hover:text-white"
              >
                ⋮
              </button>
              {dropdownOpen === emp.id && (
                <div className="absolute right-0 top-full mt-1 bg-[#2a2a2a] border border-white/20 rounded shadow-lg z-10 min-w-[120px]">
                  {emp.hasManager && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#3a3a3a] disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropInvite(emp);
                        setDropdownOpen(null);
                      }}
                      disabled={actionLoading === emp.id}
                    >
                      {actionLoading === emp.id ? "Removing..." : "Unlink Employee"}
                    </button>
                  )}
                  {!emp.hasManager && (
                    <div className="px-3 py-2 text-sm text-white/50">
                      No manager assigned
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
