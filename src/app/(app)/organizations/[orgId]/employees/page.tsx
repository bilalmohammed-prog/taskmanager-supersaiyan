"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

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
};


export default function EmployeesPage() {
  const router = useRouter();
  const { orgId } = useParams<{ orgId: string }>();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployees() {
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

      const rows = (data ?? []) as unknown as {
        user_id: string;
        profiles: Profile | null;
      }[];

      const formatted: Employee[] = rows
        .filter(row => row.profiles !== null)
        .map(row => ({
          id: row.profiles!.id,
          full_name: row.profiles!.full_name ?? "Unnamed",
          avatar_url: row.profiles!.avatar_url,
          role: "member", // You can adjust this if you have role info in another table
        }));

      setEmployees(formatted);
      setLoading(false);
    }

    loadEmployees();
  }, [orgId]);

  function openEmployee(id: string) {
    router.push(`/organizations/${orgId}/employees/${id}`);
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
            className="p-3 bg-[#1e1e1e] rounded mb-2 cursor-pointer hover:bg-[#2a2a2a]"
            onClick={() => openEmployee(emp.id)}
          >
            {emp.full_name}
          </div>
        ))}
    </div>
  );
}
