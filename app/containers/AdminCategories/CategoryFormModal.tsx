import {
  closeCategoryModal,
  saveCategoryThunk,
  selectAdminCategoriesFormOpen,
  selectAdminCategoriesSubmitting,
} from 'components/store/adminCategories/adminCategoriesSlice';
import { FC, useEffect, useRef, useState } from 'components/utils/react';
import { useSelector } from 'components/utils/react-redux';
import { dispatch } from 'components/utils/store';

import type { CategoryDTO } from '../../../types/ai-types';

interface FormValues {
  name: string;
  color: string;
}

interface Props {
  mode?: 'create' | 'edit';
  editing?: CategoryDTO;
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const CategoryFormModal: FC<Props> = ({ editing, mode }) => {
  const open = useSelector(selectAdminCategoriesFormOpen);
  const submitting = useSelector(selectAdminCategoriesSubmitting);

  const formKey = mode === 'edit' ? `edit-${editing?.id}` : 'create';

  const [values, setValues] = useState<FormValues>({
    name: '',
    color: '#000000',
  });
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editing) {
        setValues({ name: editing.name, color: editing.color || '#000000' });
      } else {
        setValues({ name: '', color: '#000000' });
      }
      setError(null);
      // Ustaw focus tylko w trybie tworzenia kategorii
      if (mode === 'create') {
        // timeout aby poczekać aż element będzie w DOM po remouncie formularza
        setTimeout(() => nameInputRef.current?.focus(), 0);
      }
    }
  }, [open, mode, editing]);

  if (!open) {
    return null;
  }

  const onChange = (e: any) => {
    const { name, value } = e.target;
    // Normalizacja koloru do uppercase gdy wybierany
    const nextValue = name === 'color' ? String(value).toUpperCase() : value;
    setValues((v) => ({ ...v, [name]: nextValue }));
  };

  const validate = () => {
    if (!values.name.trim()) {
      return 'Nazwa jest wymagana';
    }
    if (!HEX_COLOR_REGEX.test(values.color)) {
      return 'Kolor musi być w formacie #RRGGBB';
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
    const payload = { name: values.name.trim(), color: values.color };
    const id = mode === 'edit' ? editing?.id : undefined;
    dispatch(saveCategoryThunk(payload, id) as any);
  };

  return (
    <div
      aria-label="Modal dodawania kategorii"
      aria-modal="true"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          dispatch(closeCategoryModal() as any);
        }
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          // Małe opóźnienie aby zapobiec ewentualnemu kliknięciu w przycisk pod spodem po zniknięciu modala
          setTimeout(() => dispatch(closeCategoryModal() as any), 10);
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <form
        key={formKey}
        autoComplete="off"
        className="bg-white rounded shadow-lg p-6 w-full max-w-md flex flex-col gap-4"
        onSubmit={onSubmit}
      >
        <h2 className="text-lg font-semibold">
          {mode === 'edit' ? 'Edytuj kategorię' : 'Dodaj kategorię'}
        </h2>
        <label className="flex flex-col gap-1 text-sm">
          <span>Nazwa</span>
          <input
            ref={nameInputRef}
            autoComplete="off"
            className="border rounded px-2 py-1"
            name="name"
            onChange={onChange}
            required
            type="text"
            value={values.name}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Kolor</span>
          <div className="flex items-center gap-2">
            <input
              aria-label="Wybierz kolor"
              className="h-9 w-9 p-0 border rounded cursor-pointer"
              name="color"
              onChange={onChange}
              required
              type="color"
              value={values.color}
            />
            <input
              aria-label="Kod koloru HEX"
              className="border rounded px-2 py-1 font-mono text-xs w-28"
              name="colorHex"
              readOnly
              type="text"
              value={values.color}
            />
          </div>
        </label>
        {error && <div className="text-red-600 text-xs">{error}</div>}
        <div className="flex gap-2 mt-2">
          <button
            className="px-3 py-1 rounded border"
            onClick={() => dispatch(closeCategoryModal() as any)}
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

export default CategoryFormModal;
