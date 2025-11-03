import { FC, memo } from 'components/utils/react';

const App: FC = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">10xdev</h1>
      <p className="text-gray-600">Tailwind CSS is configured and working!</p>
    </div>
  </div>
);

export default memo(App);
