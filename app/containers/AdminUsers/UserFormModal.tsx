import {
  closeModal,
  saveUserThunk,
  selectAdminUsersEditing,
  selectAdminUsersFormMode,
  selectAdminUsersFormOpen,
  selectAdminUsersSubmitting,
} from 'components/store/adminUsers/adminUsersSlice';
import { FC, useEffect, useState } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import { dispatch } from 'components/utils/store';

interface FormValues {
  email: string;
  password: string;
  role: 'user' | 'admin';
}

const UserFormModal: FC = () => {
  const open = useSelector(selectAdminUsersFormOpen);
  const mode = useSelector(selectAdminUsersFormMode);
  const editing = useSelector(selectAdminUsersEditing);
  const submitting = useSelector(selectAdminUsersSubmitting);

  // Unikalny klucz formularza aby wymusić remount przy przełączaniu trybów (eliminuje artefakty stanu / autofill)
  const formKey = mode === 'edit' ? `edit-${editing?.id}` : 'create';

  const [values, setValues] = useState<FormValues>({
    email: '',
    password: '',
    role: 'user',
  });
  const [error, setError] = useState<string | null>(null);

  // Ustawienie wartości przy zmianie trybu
  useEffect(() => {
    if (mode === 'edit' && editing) {
      setValues({ email: editing.email, password: '', role: editing.role });
    } else if (mode === 'create') {
      setValues({ email: '', password: '', role: 'user' });
    }
  }, [mode, editing]);

  // Dodatkowe wymuszenie wyczyszczenia przy otwarciu w trybie "create" (chroni przed artefaktami poprzedniej edycji)
  useEffect(() => {
    if (open && mode === 'create') {
      setValues({ email: '', password: '', role: 'user' });
      setError(null);
    }
  }, [open, mode]);

  if (!open) {
    return null;
  }

  const onChange = (e: any) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const validate = () => {
    if (!values.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      return 'Niepoprawny email';
    }
    if (mode === 'create' && values.password.length < 8) {
      return 'Hasło musi mieć co najmniej 8 znaków';
    }
    if (values.password && values.password.length < 8) {
      return 'Hasło musi mieć co najmniej 8 znaków';
    }
    return null;
  };

  const onSubmit = (e: any) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const payload: any = { email: values.email, role: values.role };
    if (values.password) {
      payload.password = values.password;
    }
    // ID tylko w trybie edycji; przy create celowo brak (generowane później w thunku)
    const id = mode === 'edit' ? editing?.id : undefined;
    dispatch(saveUserThunk(payload, id) as any);
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      role="dialog"
    >
      <form
        // key wymusza odmontowanie/montowanie gdy zmienia się tryb, dzięki czemu pola są świeże i puste w trybie create
        key={formKey}
        autoComplete="off"
        className="bg-white rounded shadow-lg p-6 w-full max-w-md flex flex-col gap-4"
        onSubmit={onSubmit}
      >
        <h2 className="text-lg font-semibold">
          {mode === 'edit' ? 'Edytuj użytkownika' : 'Dodaj użytkownika'}
        </h2>
        <label className="flex flex-col gap-1 text-sm">
          <span>Email</span>
          <input
            autoComplete="off"
            className="border rounded px-2 py-1"
            name="email"
            onChange={onChange}
            required
            type="email"
            value={values.email}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>
            Hasło {mode === 'edit' && '(pozostaw puste aby nie zmieniać)'}
          </span>
          <input
            autoComplete="new-password"
            className="border rounded px-2 py-1"
            name="password"
            onChange={onChange}
            placeholder={mode === 'edit' ? '••••••••' : ''}
            type="password"
            value={values.password}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Rola</span>
          <select
            className="border rounded px-2 py-1"
            name="role"
            onChange={onChange}
            value={values.role}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>
        {error && <div className="text-red-600 text-xs">{error}</div>}
        <div className="flex gap-2 mt-2">
          <button
            className="px-3 py-1 rounded border"
            onClick={() => dispatch(closeModal() as any)}
            type="button"
          >
            Anuluj
          </button>
          <button
            className="px-3 py-1 rounded border bg-blue-600 text-white disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserFormModal;
