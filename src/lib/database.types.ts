// Supabase 스키마에 대응하는 타입. 스키마 변경 시
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
// 로 재생성할 수 있지만, 여기서는 수기로 유지합니다.

export type UserRole = "admin" | "uploader" | "viewer";
export type FileVisibility = "private" | "all" | "specific";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          invited_by: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: UserRole;
          invited_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invites"]["Insert"]>;
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          subject: string | null;
          grade: string | null;
          year: number | null;
          semester: string | null;
          exam_type: string | null;
          description: string | null;
          tags: string[];
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          visibility: FileVisibility;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          subject?: string | null;
          grade?: string | null;
          year?: number | null;
          semester?: string | null;
          exam_type?: string | null;
          description?: string | null;
          tags?: string[];
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          visibility?: FileVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["files"]["Insert"]>;
        Relationships: [];
      };
      file_shares: {
        Row: {
          id: string;
          file_id: string;
          shared_with: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_id: string;
          shared_with: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["file_shares"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      can_upload: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      file_visibility: FileVisibility;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Invite = Database["public"]["Tables"]["invites"]["Row"];
export type FileRow = Database["public"]["Tables"]["files"]["Row"];
export type FileShare = Database["public"]["Tables"]["file_shares"]["Row"];
