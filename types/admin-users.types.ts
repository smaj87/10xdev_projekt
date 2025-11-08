// Admin Users View Types
// Odzwierciedla rzeczywisty kształt odpowiedzi backendu (server/routes/admin-users.routes.mjs)

export type AdminUserRole = 'user' | 'admin';
export type AdminUserTheme = 'light' | 'dark' | 'system' | null;

export interface AdminUserDTO {
  id: number;
  email: string;
  role: AdminUserRole;
  is_blocked: boolean;
  theme: AdminUserTheme;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface AdminUsersQueryDTO {
  role?: AdminUserRole;
  is_blocked?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminUsersListResponseDTO {
  users: AdminUserDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
