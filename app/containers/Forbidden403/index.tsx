import { FC } from 'components/utils/react';

const Forbidden403: FC = () => (
  <div
    className="min-h-screen flex items-center justify-center bg-gray-100"
    data-view="403"
  >
    <div className="bg-white shadow rounded p-8 text-center">
      <h1 className="text-3xl font-bold mb-4 text-red-600">403</h1>
      <p className="text-gray-600 mb-6">
        Brak uprawnień do wyświetlenia tej strony.
      </p>
      <a className="px-4 py-2 rounded bg-blue-600 text-white text-sm" href="/">
        Powrót
      </a>
    </div>
  </div>
);

export default Forbidden403;
