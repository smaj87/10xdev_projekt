import request from 'components/utils/request';

import type { AdminUserDTO } from '../../../../types/admin-users.types';
import { RootState } from '../../../initRedux';

// Action types
export const ADMIN_USERS_FETCH_START = 'adminUsers/fetchStart' as const;
export const ADMIN_USERS_FETCH_SUCCESS = 'adminUsers/fetchSuccess' as const;
export const ADMIN_USERS_FETCH_ERROR = 'adminUsers/fetchError' as const;
export const ADMIN_USERS_SET_FILTERS = 'adminUsers/setFilters' as const;
export const ADMIN_USERS_SET_PAGE = 'adminUsers/setPage' as const;
export const ADMIN_USERS_OPEN_CREATE = 'adminUsers/openCreate' as const;
export const ADMIN_USERS_OPEN_EDIT = 'adminUsers/openEdit' as const;
export const ADMIN_USERS_CLOSE_MODAL = 'adminUsers/closeModal' as const;
export const ADMIN_USERS_SUBMIT_START = 'adminUsers/submitStart' as const;
export const ADMIN_USERS_SUBMIT_SUCCESS = 'adminUsers/submitSuccess' as const;
export const ADMIN_USERS_SUBMIT_ERROR = 'adminUsers/submitError' as const;

export interface AdminUsersFilters {
  role?: 'user' | 'admin';
  is_blocked?: boolean;
  page: number;
  limit: number;
}

export interface AdminUsersState {
  users: AdminUserDTO[];
  loading: boolean;
  error: string | null;
  filters: AdminUsersFilters;
  total: number;
  totalPages: number;
  formOpen?: boolean;
  formMode?: 'create' | 'edit';
  editingUser?: AdminUserDTO | null;
  submitting?: boolean;
  feedback?: string | null;
}

const initialState: AdminUsersState = {
  users: [],
  loading: false,
  error: null,
  filters: { page: 1, limit: 10, role: undefined, is_blocked: undefined },
  total: 0,
  totalPages: 1,
  formOpen: false,
  formMode: undefined,
  editingUser: null,
  submitting: false,
  feedback: null,
};

export type AdminUsersAction =
  | { type: typeof ADMIN_USERS_FETCH_START }
  | {
      type: typeof ADMIN_USERS_FETCH_SUCCESS;
      payload: {
        users: AdminUserDTO[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }
  | { type: typeof ADMIN_USERS_FETCH_ERROR; payload: string }
  | {
      type: typeof ADMIN_USERS_SET_FILTERS;
      payload: Partial<Omit<AdminUsersFilters, 'page'>>;
    }
  | { type: typeof ADMIN_USERS_SET_PAGE; payload: number }
  | { type: typeof ADMIN_USERS_OPEN_CREATE }
  | { type: typeof ADMIN_USERS_OPEN_EDIT; payload: AdminUserDTO }
  | { type: typeof ADMIN_USERS_CLOSE_MODAL }
  | { type: typeof ADMIN_USERS_SUBMIT_START }
  | { type: typeof ADMIN_USERS_SUBMIT_SUCCESS; payload: AdminUserDTO }
  | { type: typeof ADMIN_USERS_SUBMIT_ERROR; payload: string };

export default function adminUsersReducer(
  state: AdminUsersState = initialState,
  action: AdminUsersAction,
): AdminUsersState {
  switch (action.type) {
    case ADMIN_USERS_FETCH_START:
      return { ...state, loading: true, error: null };
    case ADMIN_USERS_FETCH_SUCCESS: {
      const exceeded =
        action.payload.page > action.payload.totalPages &&
        action.payload.totalPages > 0;

      return {
        ...state,
        loading: false,
        error: null,
        users: action.payload.users,
        filters: {
          ...state.filters,
          page: exceeded ? 1 : action.payload.page,
          limit: action.payload.limit,
        },
        total: action.payload.total,
        totalPages: action.payload.totalPages,
      };
    }
    case ADMIN_USERS_FETCH_ERROR:
      return { ...state, loading: false, error: action.payload };
    case ADMIN_USERS_SET_FILTERS: {
      const newFilters = { ...state.filters, page: 1, ...action.payload };
      return { ...state, filters: newFilters };
    }
    case ADMIN_USERS_SET_PAGE:
      return { ...state, filters: { ...state.filters, page: action.payload } };
    case ADMIN_USERS_OPEN_CREATE:
      return {
        ...state,
        formOpen: true,
        formMode: 'create',
        editingUser: null,
        feedback: null,
      };
    case ADMIN_USERS_OPEN_EDIT:
      return {
        ...state,
        formOpen: true,
        formMode: 'edit',
        editingUser: action.payload,
        feedback: null,
      };
    case ADMIN_USERS_CLOSE_MODAL:
      return {
        ...state,
        formOpen: false,
        formMode: undefined,
        editingUser: null,
        submitting: false,
      };
    case ADMIN_USERS_SUBMIT_START:
      return { ...state, submitting: true, feedback: null };
    case ADMIN_USERS_SUBMIT_SUCCESS: {
      const updated = action.payload;
      const users = state.users.map((u) => (u.id === updated.id ? updated : u));
      const exists = state.users.some((u) => u.id === updated.id);
      return {
        ...state,
        submitting: false,
        users: exists ? users : [updated, ...state.users],
        formOpen: false,
        formMode: undefined,
        editingUser: null,
        feedback: 'Zapisano użytkownika',
      };
    }
    case ADMIN_USERS_SUBMIT_ERROR:
      return { ...state, submitting: false, feedback: action.payload };
    default:
      return state;
  }
}

// Action creators
export const fetchStart = (): AdminUsersAction => ({
  type: ADMIN_USERS_FETCH_START,
});

export const fetchSuccess = (payload: {
  users: AdminUserDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}): AdminUsersAction => ({ type: ADMIN_USERS_FETCH_SUCCESS, payload });

export const fetchError = (message: string): AdminUsersAction => ({
  type: ADMIN_USERS_FETCH_ERROR,
  payload: message,
});

export const setFilters = (
  payload: Partial<Omit<AdminUsersFilters, 'page'>>,
): AdminUsersAction => ({ type: ADMIN_USERS_SET_FILTERS, payload });

export const setPage = (page: number): AdminUsersAction => ({
  type: ADMIN_USERS_SET_PAGE,
  payload: page,
});

export const openCreate = (): AdminUsersAction => ({
  type: ADMIN_USERS_OPEN_CREATE,
});

export const openEdit = (user: AdminUserDTO): AdminUsersAction => ({
  type: ADMIN_USERS_OPEN_EDIT,
  payload: user,
});

export const closeModal = (): AdminUsersAction => ({
  type: ADMIN_USERS_CLOSE_MODAL,
});

export const submitStart = (): AdminUsersAction => ({
  type: ADMIN_USERS_SUBMIT_START,
});

export const submitSuccess = (user: AdminUserDTO): AdminUsersAction => ({
  type: ADMIN_USERS_SUBMIT_SUCCESS,
  payload: user,
});

export const submitError = (msg: string): AdminUsersAction => ({
  type: ADMIN_USERS_SUBMIT_ERROR,
  payload: msg,
});

// Thunk
export const loadAdminUsersThunk =
  () => async (dispatch: any, getState: () => RootState) => {
    const { filters } = (getState() as RootState).adminUsers;
    const params = new URLSearchParams();

    params.set('page', String(filters.page));
    params.set('limit', String(filters.limit));

    if (filters.role) {
      params.set('role', filters.role);
    }

    if (filters.is_blocked !== undefined) {
      params.set('is_blocked', String(filters.is_blocked));
    }

    const url = `/api/admin/users?${params.toString()}`;

    dispatch(fetchStart());

    try {
      const data = (await request(url)) as any; // backend shape

      dispatch(
        fetchSuccess({
          users: data.users || [],
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages || 1,
        }),
      );
    } catch (e: any) {
      dispatch(fetchError(e?.message || 'Błąd pobierania użytkowników'));
    }
  };

export const toggleBlockUserThunk =
  (user: AdminUserDTO) => async (dispatch: any, getState: () => RootState) => {
    const currentId = (getState() as RootState).auth.user?.id;
    if (currentId === user.id) {
      dispatch(submitError('Nie możesz blokować własnego konta'));
      return;
    }
    dispatch(submitStart());
    try {
      const body = { is_blocked: !user.is_blocked };
      const updated = (await request(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        body,
      })) as AdminUserDTO;
      dispatch(submitSuccess(updated));
    } catch (e: any) {
      dispatch(submitError(e?.message || 'Błąd zmiany blokady'));
    }
  };

export const changeUserRoleThunk =
  (user: AdminUserDTO, role: 'user' | 'admin') => async (dispatch: any) => {
    dispatch(submitStart());
    try {
      const body = { role };
      const updated = (await request(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        body,
      })) as AdminUserDTO;
      dispatch(submitSuccess(updated));
    } catch (e: any) {
      dispatch(submitError(e?.message || 'Błąd zmiany roli'));
    }
  };

export interface SaveUserValues {
  email: string;
  password?: string;
  role?: 'user' | 'admin';
}

export const saveUserThunk =
  (values: SaveUserValues, id?: number) =>
  async (dispatch: any, getState: () => RootState) => {
    dispatch(submitStart());
    try {
      const editing = id
        ? (getState() as RootState).adminUsers.users.find((u) => u.id === id)
        : undefined;
      const userId = id ?? Date.now();
      const body: any = {};
      // Diff logic
      if (!editing) {
        body.email = values.email;
        body.password = values.password; // wymagane przy create
        body.role = values.role || 'user';
      } else {
        if (values.email && values.email !== editing.email) {
          body.email = values.email;
        }
        if (values.password) {
          body.password = values.password;
        } // tylko jeśli podane
        if (values.role && values.role !== editing.role) {
          body.role = values.role;
        }
      }
      if (Object.keys(body).length === 0) {
        dispatch(submitError('Brak zmian do zapisania'));
        return;
      }
      const updated = (await request(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body,
      })) as AdminUserDTO;
      dispatch(submitSuccess(updated));
    } catch (e: any) {
      const rawMsg = String(e?.message || 'Błąd zapisu użytkownika');
      const isEmailExists =
        rawMsg.includes('400') && rawMsg.toLowerCase().includes('email');
      dispatch(submitError(isEmailExists ? 'Email już istnieje' : rawMsg));
    }
  };

// Selectors
export const selectAdminUsers = (state: RootState) => state.adminUsers.users;

export const selectAdminUsersLoading = (state: RootState) =>
  state.adminUsers.loading;

export const selectAdminUsersError = (state: RootState) =>
  state.adminUsers.error;

export const selectAdminUsersFilters = (state: RootState) =>
  state.adminUsers.filters;

export const selectAdminUsersTotalPages = (state: RootState) =>
  state.adminUsers.totalPages;
export const selectAdminUsersFormOpen = (state: RootState) =>
  state.adminUsers.formOpen;
export const selectAdminUsersFormMode = (state: RootState) =>
  state.adminUsers.formMode;
export const selectAdminUsersEditing = (state: RootState) =>
  state.adminUsers.editingUser;
export const selectAdminUsersSubmitting = (state: RootState) =>
  state.adminUsers.submitting;
export const selectAdminUsersFeedback = (state: RootState) =>
  state.adminUsers.feedback;
