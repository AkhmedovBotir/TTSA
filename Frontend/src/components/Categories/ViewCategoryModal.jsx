import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ViewCategoryModal({ isOpen, onClose, category }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Yopish</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Holati</h4>
              <p className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {category.status === 'active' ? 'Faol' : 'Faol emas'}
                </span>
              </p>
            </div>

            {category.createdAt && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Yaratilgan sana</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(category.createdAt).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            )}

            {category.createdBy?.name && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Yaratuvchi</h4>
                <p className="mt-1 text-sm text-gray-900">{category.createdBy.name}</p>
              </div>
            )}

            {category.subcategories?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Subkategoriyalar ({category.subcategories.length})</h4>
                <div className="mt-2 space-y-2">
                  {category.subcategories.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-sm font-medium text-gray-900">{sub.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sub.status === 'active' ? 'Faol' : 'Faol emas'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
