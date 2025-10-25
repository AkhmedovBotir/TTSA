import React from 'react';
import { ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const NoPage = ({ message = "Bu sahifaga kirish uchun ruxsat yo'q" }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Ruxsat yo'q
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Bosh sahifaga qaytish
          </Link>
          
          <p className="text-sm text-gray-500">
            Agar bu xatolik deb hisoblasangiz, administrator bilan bog'laning
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoPage;

