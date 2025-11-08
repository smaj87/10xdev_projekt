import { FC } from 'components/utils/react';

const LoadingScreen: FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="text-sm text-gray-600">Ładowanie...</p>
    </div>
  </div>
);

export default LoadingScreen; // used in App
