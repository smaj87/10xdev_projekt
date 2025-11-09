import { FC, memo } from 'components/utils/react';

import type { CategoryDTO } from '../../../types/ai-types';
import CategoryRowActions from './CategoryRowActions';

interface CategoriesTableProps {
  categories: CategoryDTO[];
}

const Row: FC<{ category: CategoryDTO }> = memo(({ category }) => (
  <tr key={category.id} className="border-t hover:bg-blue-50 transition-colors">
    <td className="px-4 py-2">{category.id}</td>
    <td className="px-4 py-2 font-medium">{category.name}</td>
    <td className="px-4 py-2">
      {category.color ? (
        <span className="inline-flex items-center gap-2">
          <span
            aria-label={category.color}
            className="w-5 h-5 rounded border"
            style={{ backgroundColor: category.color }}
          />
          <span className="font-mono text-xs">{category.color}</span>
        </span>
      ) : (
        '—'
      )}
    </td>
    <td className="px-4 py-2 whitespace-nowrap">
      {new Date(category.created_at).toLocaleDateString()}
    </td>
    <td className="px-4 py-2 text-xs text-gray-600">
      <CategoryRowActions category={category} />
    </td>
  </tr>
));
Row.displayName = 'CategoryRow';

const CategoriesTable: FC<CategoriesTableProps> = ({ categories }) => (
  <div className="flex-1 overflow-auto bg-white rounded shadow">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100 text-left">
        <tr>
          <th className="px-4 py-2 font-medium" scope="col">
            ID
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Nazwa
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Kolor
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Utworzono
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Akcje
          </th>
        </tr>
      </thead>
      <tbody>
        {categories.length === 0 && (
          <tr>
            <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
              Brak kategorii.
            </td>
          </tr>
        )}
        {categories.map((c) => (
          <Row key={c.id} category={c} />
        ))}
      </tbody>
    </table>
  </div>
);

export default CategoriesTable;
