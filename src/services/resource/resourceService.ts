import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/types/database";

export async function listResources(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<Tables<"resources">[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("organization_id", params.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listHumanResources(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string }
): Promise<Tables<"resources">[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("organization_id", params.organizationId)
    .eq("type", "human")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createResource(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    name: string;
    type: TablesInsert<"resources">["type"];
  }
): Promise<Tables<"resources">> {
  const insert: TablesInsert<"resources"> = {
    name: params.name,
    type: params.type,
    organization_id: params.organizationId,
  };

  const { data, error } = await supabase
    .from("resources")
    .insert(insert)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create resource");
  return data;
}

export async function updateResource(
  supabase: SupabaseClient<Database>,
  params: {
    organizationId: string;
    resourceId: string;
    updates: TablesUpdate<"resources">;
  }
): Promise<Tables<"resources">> {
  const { data, error } = await supabase
    .from("resources")
    .update(params.updates)
    .eq("id", params.resourceId)
    .eq("organization_id", params.organizationId)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update resource");
  return data;
}

export async function softDeleteResource(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; resourceId: string }
): Promise<void> {
  const { error } = await supabase
    .from("resources")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.resourceId)
    .eq("organization_id", params.organizationId);

  if (error) throw new Error(error.message);
}

