export type Role = "admin" | "user ";

export interface UserMe {
  id: string;
  email: string;
  full_name?: string | null;
  role: Role;
  allowed_modules: string[];
  is_active: boolean;
  must_change_password: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
    token_type: "baerer";
    must_change_password: boolean;  
}

export type UserPublic = UserMe;

export interface CreateUserPayload {
  email: string;
  full_name?: string | null;
  //password: string;
  role: Role;
  allowed_modules: string[];
}

export interface CreateUserResponse {
  user: UserPublic;
  temporary_password: string;
}

export interface ImportPreviewResponse {
  expected_columns: string[];
  received_columns: string[];
  valid: boolean;
  preview_rows: Record<string, unknown>[];
  errors: { row: number; field?: string | null; message: string }[];
}

export interface ImportCommitResponse {
  total_rows: number;
  created: number;
  updated: number;
  errors: { row: number; field?: string | null; message: string }[];
  batch_id?: string | null;
}
export interface Computer {
  id: string;
  inventory_code: string;
  hostname: string;
  serial_number: string;

  brand?: string | null;
  model?: string | null;
  memory_raw?: string | null;
  equipment_type?: string | null;
  cpu?: string | null;
  gpu?: string | null;
  storage_raw?: string | null;
  acquisition_type?: string | null;

  // Estado de red
  ip_address?: string | null;
  is_online?: boolean | null;
  last_seen_online?: string | null;
  last_ping_at?: string | null;

  last_imported_at: string;
  created_at: string;
  updated_at: string;
}

export interface ComputerListResponse {
  items: Computer[];
  total: number;
  page: number;
  page_size: number;
}
