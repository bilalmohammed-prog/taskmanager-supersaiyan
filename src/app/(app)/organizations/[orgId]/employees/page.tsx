"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Download, Filter, MoreVertical, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { dropInvite } from "@/lib/api";
import { useToast } from "@/components/providers/toast";
import { useOrgRole } from "@/hooks/useOrgRole";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
};

type Employee = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string | null;
  role: string;
  hasManager: boolean;
  empId: string | null;
};

type ManagerEmployeeRow = {
  employee_id: string;
  manager_id: string | null;
};

export default function EmployeesPage() {
  const role = useOrgRole();
  const canManage = role === "owner" || role === "admin" || role === "manager";
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
            avatar_url,
            username
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
        .filter((row) => row.profiles !== null)
        .map((row) => row.profiles!.id);

      const { data: managerData, error: managerError } = await supabase
        .from("manager_employees")
        .select("employee_id, manager_id")
        .in("employee_id", employeeIds)
        .returns<ManagerEmployeeRow[]>();

      if (managerError) {
        console.error(managerError);
      }

      const managerMap = new Map((managerData ?? []).map((row) => [row.employee_id, row]));

      const formatted: Employee[] = rows
        .filter((row) => row.profiles !== null)
        .map((row) => {
          const profile = row.profiles!;
          const managerInfo = managerMap.get(profile.id);

          return {
            id: profile.id,
            full_name: profile.full_name ?? "Unnamed",
            avatar_url: profile.avatar_url,
            email: profile.username ?? null,
            role: "member",
            hasManager: !!managerInfo,
            empId: managerInfo?.employee_id ?? null,
          };
        });

      setEmployees(formatted);
      setLoading(false);
    }

    loadEmployees();
  }, [orgId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen(null);
    };

    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dropdownOpen]);

  function openEmployee(id: string) {
    router.push(`/organizations/${orgId}/employees/${id}`);
  }

  async function handleDropInvite(employee: Employee) {
    if (!employee.hasManager) {
      return;
    }
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

      setEmployees((prev) =>
        prev.map((entry) =>
          entry.id === employee.id ? { ...entry, hasManager: false } : entry
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
    <div className="flex w-full max-w-5xl flex-col space-y-8 pb-16">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <h1 className="text-[2rem] leading-none font-medium tracking-tight text-zinc-900">
            Employees
          </h1>
          <p className="max-w-lg text-[15px] text-zinc-500">
            Manage your team members, roles, and account permissions.
          </p>
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              placeholder="Search..."
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <button
            type="button"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 sm:inline-flex"
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 sm:inline-flex"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading...</p>}

      {!loading && employees.length === 0 && (
        <p className="text-sm text-zinc-500">No employees found.</p>
      )}

      <div className="flex flex-col gap-3">
        {!loading &&
          employees.map((employee) => (
            <div
              key={employee.id}
              className="group relative flex cursor-pointer flex-col justify-between gap-4 rounded-lg border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center sm:px-6 sm:py-5"
              onClick={() => openEmployee(employee.id)}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted ring-1 ring-border transition-all duration-200">
                  <span className="text-base font-medium text-foreground">
                    {employee.full_name.charAt(0).toUpperCase()}
                  </span>
                  <span
                    className={`absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-card ${
                      employee.hasManager ? "bg-foreground" : "bg-muted-foreground"
                    }`}
                  />
                </div>

                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-base font-medium text-foreground">
                    {employee.full_name}
                  </span>
                  {employee.email && (
                    <span className="mt-0.5 truncate text-sm text-muted-foreground">
                      {employee.email}
                    </span>
                  )}
                  <span className="mt-0.5 truncate text-sm text-muted-foreground">
                    {employee.role}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex w-full items-center justify-between gap-6 border-t border-border/60 pt-3 sm:mt-0 sm:w-auto sm:justify-end sm:border-0 sm:pt-0">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center rounded-md border border-border/60 bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all duration-200">
                    {employee.role}
                  </span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    aria-label="More options"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(dropdownOpen === employee.id ? null : employee.id);
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-border"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {dropdownOpen === employee.id && (
                    <div className="absolute right-0 top-full z-10 mt-2 min-w-[160px] rounded-lg border border-border/60 bg-card p-1 shadow-sm">
                      {canManage && employee.hasManager ? (
                        <button
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-foreground transition-all duration-200 hover:bg-muted disabled:opacity-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDropInvite(employee);
                            setDropdownOpen(null);
                          }}
                          disabled={actionLoading === employee.id}
                        >
                          {actionLoading === employee.id ? "Removing..." : "Unlink Employee"}
                        </button>
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No actions available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
