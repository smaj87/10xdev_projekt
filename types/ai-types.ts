/**
 * AI-Generated DTO and Command Models
 *
 * Ten plik zawiera typy DTO (Data Transfer Objects) i Command Models
 * dla aplikacji Tasks, wygenerowane na podstawie schematu bazy danych i planu API.
 *
 * Wszystkie typy są połączone z definicjami tabel w bazie danych SQLite.
 */

// ============================================================================
// BASE DATABASE ENTITY TYPES
// ============================================================================

/**
 * Tabela: users
 * Reprezentuje użytkownika w systemie
 */
export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  is_blocked: boolean;
  theme: 'light' | 'dark' | 'system';
  created_at: string; // ISO DateTime
  updated_at: string; // ISO DateTime
}

/**
 * Tabela: categories
 * Reprezentuje kategorię list zadań
 */
export interface Category {
  id: number;
  name: string;
  color: string | null;
  created_at: string; // ISO DateTime
}

/**
 * Tabela: lists
 * Reprezentuje listę zadań należącą do użytkownika
 */
export interface List {
  id: number;
  title: string;
  owner_id: number;
  category_id: number | null;
  priority: 'low' | 'normal' | 'high';
  due_date: string | null; // ISO Date YYYY-MM-DD
  is_archived: boolean;
  archived_at: string | null; // ISO DateTime
  created_at: string; // ISO DateTime
  updated_at: string; // ISO DateTime
}

/**
 * Tabela: tasks
 * Reprezentuje pojedyncze zadanie w liście
 */
export interface Task {
  id: number;
  list_id: number;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  sort_order: number;
  created_at: string; // ISO DateTime
  updated_at: string; // ISO DateTime
}

/**
 * Tabela: list_collaborators
 * Reprezentuje współpracownika przypisanego do listy
 */
export interface ListCollaborator {
  id: number;
  list_id: number;
  user_id: number;
  role: 'collaborator';
  added_at: string; // ISO DateTime
}

/**
 * Tabela: error_logs
 * Reprezentuje log błędu w systemie
 */
export interface ErrorLog {
  id: number;
  user_id: number | null;
  endpoint: string;
  method: string;
  status_code: number;
  error_message: string | null;
  request_data: string | null;
  response_data: string | null;
  user_agent: string | null;
  created_at: string; // ISO DateTime
}

/**
 * Tabela: user_sessions
 * Reprezentuje aktywną sesję użytkownika
 */
export interface UserSession {
  id: string; // UUID
  user_id: number;
  expires_at: string; // ISO DateTime
  created_at: string; // ISO DateTime
}

// ============================================================================
// COMMON/UTILITY TYPES
// ============================================================================

/**
 * Wspólne parametry paginacji dla endpointów zwracających listy
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Generyczna odpowiedź z paginacją
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

/**
 * Publiczne dane użytkownika (bez wrażliwych informacji)
 * Omit usuwa password_hash z typu User
 */
export type UserPublicDTO = Omit<User, 'password_hash'>;

/**
 * Podstawowy DTO użytkownika do autentykacji/odpowiedzi
 */
export type UserAuthDTO = Pick<User, 'id' | 'email' | 'role'>;

// ============================================================================
// AUTHENTICATION DTOs
// ============================================================================

/**
 * Command: Login użytkownika
 * Endpoint: POST /api/auth/login
 */
export interface LoginCommand {
  email: string;
  password: string;
}

/**
 * Response: Pomyślny login
 * Endpoint: POST /api/auth/login (200)
 */
export interface LoginResponseDTO {
  sessionId: string;
  user: UserAuthDTO;
}

/**
 * Response: Informacje o sesji
 * Endpoint: GET /api/auth/session (200)
 */
export interface SessionInfoDTO {
  sessionId: string;
  user: UserAuthDTO;
  expiresAt: string; // ISO DateTime
}

// ============================================================================
// USERS/ADMIN DTOs
// ============================================================================

/**
 * Query params: Lista użytkowników (admin)
 * Endpoint: GET /api/admin/users
 */
export interface ListUsersQueryDTO extends PaginationParams {
  role?: 'user' | 'admin';
  is_blocked?: boolean;
}

/**
 * Response: Lista użytkowników (admin)
 * Endpoint: GET /api/admin/users (200)
 */
export interface UsersListResponseDTO {
  users: UserPublicDTO[];
  page: number;
  total: number;
}

/**
 * Command: Aktualizacja roli/blokady użytkownika (admin)
 * Endpoint: PATCH /api/admin/users/{userId}
 * Partial - wszystkie pola opcjonalne
 */
export type UpdateUserCommand = Partial<Pick<User, 'role' | 'is_blocked'>>;

// ============================================================================
// CATEGORIES DTOs
// ============================================================================

/**
 * DTO: Podstawowa kategoria
 * Używane w różnych odpowiedziach API
 */
export type CategoryDTO = Category;

/**
 * Command: Utworzenie kategorii (admin)
 * Endpoint: POST /api/categories
 * Pick wybiera tylko name i color, color może być null
 */
export type CreateCategoryCommand = Pick<Category, 'name' | 'color'>;

/**
 * Command: Aktualizacja kategorii (admin)
 * Endpoint: PATCH /api/categories/{id}
 * Partial - pola opcjonalne dla PATCH
 */
export type UpdateCategoryCommand = Partial<CreateCategoryCommand>;

// ============================================================================
// LISTS DTOs
// ============================================================================

/**
 * Query params: Lista list użytkownika
 * Endpoint: GET /api/lists
 */
export interface ListQueryDTO extends PaginationParams {
  archived?: boolean;
  category_id?: number;
  priority?: 'low' | 'normal' | 'high';
  due_date?: string; // ISO Date YYYY-MM-DD
  sort_by?: 'title' | 'due_date' | 'priority' | 'created_at';
  order?: 'asc' | 'desc';
}

/**
 * DTO: Podstawowa lista
 * Omit usuwa owner_id (wrażliwe), category_id zastąpione przez category object
 */
export interface ListDTO extends Omit<List, 'category_id'> {
  category?: CategoryDTO | null; // Rozszerzone o pełny obiekt kategorii
}

/**
 * Response: Lista list użytkownika
 * Endpoint: GET /api/lists (200)
 */
export type ListsResponseDTO = PaginatedResponse<ListDTO>;

/**
 * Command: Utworzenie nowej listy
 * Endpoint: POST /api/lists
 */
export interface CreateListCommand {
  title: string;
  category_id?: number | null;
  priority?: 'low' | 'normal' | 'high'; // domyślnie 'normal'
  due_date?: string | null; // ISO Date YYYY-MM-DD
}

/**
 * DTO: Szczegóły listy z zadaniami i współpracownikami
 * Endpoint: GET /api/lists/{listId} (200)
 */
export interface ListDetailDTO extends ListDTO {
  tasks: TaskDTO[];
  collaborators: CollaboratorDTO[];
}

/**
 * Command: Aktualizacja listy
 * Endpoint: PATCH /api/lists/{listId}
 * Partial - wszystkie pola opcjonalne, Pick wybiera edytowalne pola
 */
export type UpdateListCommand = Partial<
  Pick<List, 'title' | 'category_id' | 'priority' | 'due_date' | 'is_archived'>
>;

// ============================================================================
// TASKS DTOs
// ============================================================================

/**
 * DTO: Podstawowe zadanie
 */
export type TaskDTO = Task;

/**
 * Query params: Lista zadań w liście
 * Endpoint: GET /api/lists/{listId}/tasks
 */
export interface TasksQueryDTO {
  status?: 'todo' | 'in_progress' | 'done';
  sort_by?: 'sort_order' | 'created_at';
  order?: 'asc' | 'desc';
}

/**
 * Command: Utworzenie zadania
 * Endpoint: POST /api/lists/{listId}/tasks
 * list_id jest w URL, sort_order auto-assigned
 */
export interface CreateTaskCommand {
  title: string;
}

/**
 * Command: Aktualizacja zadania
 * Endpoint: PATCH /api/tasks/{taskId}
 * Partial - pola opcjonalne
 */
export type UpdateTaskCommand = Partial<
  Pick<Task, 'title' | 'status' | 'sort_order'>
>;

/**
 * Command: Zmiana kolejności zadań (batch)
 * Endpoint: PUT /api/lists/{listId}/tasks/reorder
 */
export interface ReorderTasksCommand {
  order: Array<{
    id: number;
    position: number;
  }>;
}

// ============================================================================
// COLLABORATORS DTOs
// ============================================================================

/**
 * DTO: Współpracownik z danymi użytkownika
 * Rozszerzone o informacje o użytkowniku
 */
export interface CollaboratorDTO extends ListCollaborator {
  user?: UserPublicDTO; // Opcjonalnie dołączone dane użytkownika
}

/**
 * Command: Dodanie współpracownika (admin/owner)
 * Endpoint: POST /api/lists/{listId}/collaborators
 */
export interface AddCollaboratorCommand {
  user_id: number;
}

// ============================================================================
// ERROR LOGS DTOs (Admin)
// ============================================================================

/**
 * Query params: Lista logów błędów (admin)
 * Endpoint: GET /api/admin/error-logs
 */
export interface ErrorLogQueryDTO extends PaginationParams {
  user_id?: number;
  status_code?: number;
  endpoint?: string;
}

/**
 * Response: Lista logów błędów (admin)
 * Endpoint: GET /api/admin/error-logs (200)
 */
export type ErrorLogsResponseDTO = PaginatedResponse<ErrorLog>;

// ============================================================================
// TYPE GUARDS & VALIDATION HELPERS
// ============================================================================

/**
 * Type guard: Sprawdza czy wartość jest prawidłową rolą użytkownika
 */
export function isValidUserRole(value: unknown): value is User['role'] {
  return value === 'user' || value === 'admin';
}

/**
 * Type guard: Sprawdza czy wartość jest prawidłowym priorytetem
 */
export function isValidPriority(value: unknown): value is List['priority'] {
  return value === 'low' || value === 'normal' || value === 'high';
}

/**
 * Type guard: Sprawdza czy wartość jest prawidłowym statusem zadania
 */
export function isValidTaskStatus(value: unknown): value is Task['status'] {
  return value === 'todo' || value === 'in_progress' || value === 'done';
}

/**
 * Type guard: Sprawdza czy wartość jest prawidłowym motywem
 */
export function isValidTheme(value: unknown): value is User['theme'] {
  return value === 'light' || value === 'dark' || value === 'system';
}

// ============================================================================
// CONST ENUMS FOR VALIDATION
// ============================================================================

/**
 * Dostępne role użytkowników
 */
export const USER_ROLES = ['user', 'admin'] as const;

/**
 * Dostępne priorytety list
 */
export const LIST_PRIORITIES = ['low', 'normal', 'high'] as const;

/**
 * Dostępne statusy zadań
 */
export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;

/**
 * Dostępne motywy interfejsu
 */
export const USER_THEMES = ['light', 'dark', 'system'] as const;
