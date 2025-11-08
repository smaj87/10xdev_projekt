import { FC, memo } from 'components/utils/react';

import type { AdminUserDTO } from '../../../types/admin-users.types';
import UserRowActions from './UserRowActions';

interface AdminUserTableProps {
  users: AdminUserDTO[];
  currentAdminId?: number;
}

const Row: FC<{ user: AdminUserDTO; currentAdminId?: number }> = memo(
  ({ currentAdminId, user }) => (
    <tr key={user.id} className="border-t hover:bg-blue-50 transition-colors">
      <td className="px-4 py-2">{user.id}</td>
      <td className="px-4 py-2 font-mono break-all">{user.email}</td>
      <td className="px-4 py-2">{user.role}</td>
      <td className="px-4 py-2">{user.is_blocked ? 'TAK' : 'NIE'}</td>
      <td className="px-4 py-2">{user.theme ?? '—'}</td>
      <td className="px-4 py-2 whitespace-nowrap">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-2 whitespace-nowrap">
        {new Date(user.updated_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-2 text-xs text-gray-600">
        <UserRowActions currentAdminId={currentAdminId} user={user} />
      </td>
    </tr>
  ),
);
Row.displayName = 'AdminUserRow';

const AdminUserTable: FC<AdminUserTableProps> = ({ currentAdminId, users }) => (
  <div className="flex-1 overflow-auto bg-white rounded shadow">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100 text-left">
        <tr>
          <th className="px-4 py-2 font-medium" scope="col">
            ID
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Email
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Rola
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Blokada
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Motyw
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Utworzono
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Aktualizacja
          </th>
          <th className="px-4 py-2 font-medium" scope="col">
            Akcje
          </th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 && (
          <tr>
            <td className="px-4 py-6 text-center text-gray-500" colSpan={8}>
              Brak użytkowników dla wybranych filtrów.
            </td>
          </tr>
        )}
        {users.map((u) => (
          <Row key={u.id} currentAdminId={currentAdminId} user={u} />
        ))}
      </tbody>
    </table>
  </div>
);

export default AdminUserTable;
