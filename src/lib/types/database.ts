// Supabase recommended typing pattern.
// Keep this file aligned with your Postgres schema.

// Supabase/TypeScript convention: UUID columns are represented as `string`.
export type UUID = string;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type RoleType = "owner" | "admin" | "manager" | "employee" | "viewer";
type ProjectStatus = "active" | "paused" | "archived";
type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
type ResourceType = "human" | "equipment" | "room" | "vehicle" | "software";

type AssignmentsTable = {
  Row: {
    id: UUID;
    resource_id: UUID;
    task_id: UUID;
    allocated_hours: number | null;
    start_time: string | null;
    end_time: string | null;
    created_at: string | null;
  };
  Insert: {
    id?: UUID;
    resource_id: UUID;
    task_id: UUID;
    allocated_hours?: number | null;
    start_time?: string | null;
    end_time?: string | null;
    created_at?: string | null;
  };
  Update: {
    id?: UUID;
    resource_id?: UUID;
    task_id?: UUID;
    allocated_hours?: number | null;
    start_time?: string | null;
    end_time?: string | null;
    created_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "assignments_task_id_fkey";
      columns: ["task_id"];
      isOneToOne: false;
      referencedRelation: "tasks";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "assignments_resource_id_fkey";
      columns: ["resource_id"];
      isOneToOne: false;
      referencedRelation: "resources";
      referencedColumns: ["id"];
    },
  ];
};

export type Database = {
  // Used by Supabase client types.
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      organizations: {
        Row: {
          id: UUID;
          name: string;
          slug: string;
          created_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: UUID;
          name: string;
          slug: string;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: UUID;
          name?: string;
          slug?: string;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };

      profiles: {
        Row: {
          id: UUID;
          full_name: string | null;
          avatar_url: string | null;
          active_organization_id: UUID | null;
          created_at: string | null;
        };
        Insert: {
          id: UUID;
          full_name?: string | null;
          avatar_url?: string | null;
          active_organization_id?: UUID | null;
          created_at?: string | null;
        };
        Update: {
          id?: UUID;
          full_name?: string | null;
          avatar_url?: string | null;
          active_organization_id?: UUID | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_active_organization_id_fkey";
            columns: ["active_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      resources: {
        Row: {
          id: UUID;
          organization_id: UUID;
          name: string;
          type: ResourceType;
          capacity: number | null;
          metadata: Json | null;
          created_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: UUID;
          organization_id: UUID;
          name: string;
          type: ResourceType;
          capacity?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: UUID;
          organization_id?: UUID;
          name?: string;
          type?: ResourceType;
          capacity?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "resources_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      org_members: {
        Row: {
          id: UUID;
          organization_id: UUID;
          user_id: UUID;
          role: RoleType;
          created_at: string | null;
        };
        Insert: {
          id?: UUID;
          organization_id: UUID;
          user_id: UUID;
          role?: RoleType;
          created_at?: string | null;
        };
        Update: {
          id?: UUID;
          organization_id?: UUID;
          user_id?: UUID;
          role?: RoleType;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "org_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      projects: {
        Row: {
          id: UUID;
          organization_id: UUID;
          name: string;
          status: ProjectStatus | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: UUID;
          organization_id: UUID;
          name: string;
          status?: ProjectStatus | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: UUID;
          organization_id?: UUID;
          name?: string;
          status?: ProjectStatus | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };

      tasks: {
        Row: {
          id: UUID;
          organization_id: UUID;
          project_id: UUID | null;
          title: string;
          description: string | null;
          status: TaskStatus | null;
          due_date: string | null;
          created_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: UUID;
          organization_id: UUID;
          project_id?: UUID | null;
          title: string;
          description?: string | null;
          status?: TaskStatus | null;
          due_date?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: UUID;
          organization_id?: UUID;
          project_id?: UUID | null;
          title?: string;
          description?: string | null;
          status?: TaskStatus | null;
          due_date?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };

      // The schema in this repo currently uses `resource_assignments`.
      // We model `assignments` as the canonical type and also expose `resource_assignments` as an alias table key.
      assignments: AssignmentsTable;

      // Backward-compatible alias for existing queries in the codebase.
      resource_assignments: AssignmentsTable;

      comments: {
        Row: {
          id: UUID;
          task_id: UUID;
          content: string;
          user_id: UUID | null;
          created_at: string | null;
        };
        Insert: {
          id?: UUID;
          task_id: UUID;
          content: string;
          user_id?: UUID | null;
          created_at?: string | null;
        };
        Update: {
          id?: UUID;
          task_id?: UUID;
          content?: string;
          user_id?: UUID | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      project_members: {
        Row: {
          project_id: UUID;
          resource_id: UUID;
          left_at: string | null;
          created_at: string | null;
        };
        Insert: {
          project_id: UUID;
          resource_id: UUID;
          left_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          project_id?: UUID;
          resource_id?: UUID;
          left_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      role_type: RoleType;
      project_status: ProjectStatus;
      task_status: TaskStatus;
      resource_type: ResourceType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type PublicSchema = DatabaseWithoutInternals[Extract<
  keyof DatabaseWithoutInternals,
  "public"
>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends PublicEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

