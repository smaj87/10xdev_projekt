import { FC } from 'components/utils/react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const Pagination: FC<PaginationProps> = ({ onChange, page, totalPages }) => {
  if (totalPages < 2) {
    return null;
  }
  return (
    <nav
      aria-label="Paginacja użytkowników"
      className="mt-4 flex flex-wrap items-center gap-2 justify-center"
    >
      <span className="text-xs text-gray-600">
        Strona {page} z {totalPages}
      </span>
      <button
        className="px-2 py-1 text-xs rounded border bg-white disabled:opacity-40"
        disabled={page === 1}
        onClick={() => onChange(1)}
        type="button"
      >
        « Pierwsza
      </button>
      <button
        className="px-2 py-1 text-xs rounded border bg-white disabled:opacity-40"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        type="button"
      >
        ‹ Poprzednia
      </button>
      {Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        const isCurrent = p === page;
        return (
          <button
            key={p}
            aria-current={isCurrent ? 'page' : undefined}
            className={`px-3 py-1 rounded border text-xs ${isCurrent ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-blue-50'} disabled:opacity-60`}
            disabled={isCurrent}
            onClick={() => onChange(p)}
            type="button"
          >
            {p}
          </button>
        );
      })}
      <button
        className="px-2 py-1 text-xs rounded border bg-white disabled:opacity-40"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        Następna ›
      </button>
      <button
        className="px-2 py-1 text-xs rounded border bg-white disabled:opacity-40"
        disabled={page === totalPages}
        onClick={() => onChange(totalPages)}
        type="button"
      >
        Ostatnia »
      </button>
    </nav>
  );
};

export default Pagination;
