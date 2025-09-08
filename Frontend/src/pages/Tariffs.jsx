import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import CreateTariffModal from '../components/Tariffs/CreateTariffModal';
import EditTariffModal from '../components/Tariffs/EditTariffModal';
import DeleteTariffModal from '../components/Tariffs/DeleteTariffModal';

const Tariffs = () => {
  const [tariffs, setTariffs] = useState([
    {
      id: 1,
      name: "Standart",
      price: "99,000",
      duration: "30",
      features: [
        "5 ta foydalanuvchi",
        "Cheksiz mijozlar",
        "Cheksiz xodimlar",
        "Asosiy CRM funksiyalari",
      ],
      isPopular: false,
      status: "active"
    },
    {
      id: 2,
      name: "Premium",
      price: "199,000",
      duration: "30",
      features: [
        "20 ta foydalanuvchi",
        "Cheksiz mijozlar",
        "Cheksiz xodimlar",
        "Barcha CRM funksiyalari",
        "24/7 qo'llab-quvvatlash",
      ],
      isPopular: true,
      status: "active"
    },
    {
      id: 3,
      name: "Enterprise",
      price: "499,000",
      duration: "30",
      features: [
        "Cheksiz foydalanuvchilar",
        "Cheksiz mijozlar",
        "Cheksiz xodimlar",
        "Barcha CRM funksiyalari",
        "24/7 shaxsiy menedjer",
        "API integratsiya",
      ],
      isPopular: false,
      status: "active"
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState(null);

  const handleStatusChange = (tariffId) => {
    setTariffs(tariffs.map(tariff => {
      if (tariff.id === tariffId) {
        return {
          ...tariff,
          status: tariff.status === 'active' ? 'inactive' : 'active'
        };
      }
      return tariff;
    }));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Tariflar
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Tizimning barcha tariflarini boshqarish va yangi tariflar qo'shish
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Yangi tarif
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {tariffs.map((tariff) => (
          <div
            key={tariff.id}
            className={`relative rounded-2xl border p-8 shadow-sm flex flex-col ${
              tariff.isPopular ? 'border-blue-500 shadow-blue-100' : 'border-gray-200'
            }`}
          >
            {tariff.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-4 py-1 text-xs font-medium text-blue-800">
                  Ommabop
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{tariff.name}</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={tariff.status === 'active'}
                  onChange={() => handleStatusChange(tariff.id)}
                  className={`${
                    tariff.status === 'active' ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      tariff.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
                <button
                  onClick={() => {
                    setSelectedTariff(tariff);
                    setShowEditModal(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedTariff(tariff);
                    setShowDeleteModal(true);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold tracking-tight text-gray-900">
                {tariff.price}
              </span>
              <span className="ml-1 text-xl font-semibold text-gray-500">so'm</span>
              <span className="ml-2 text-sm text-gray-500">/{tariff.duration} kun</span>
            </div>

            <ul className="mt-6 space-y-4 flex-1">
              {tariff.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="ml-3 text-base text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`mt-8 block w-full rounded-md border px-6 py-3 text-center text-sm font-medium ${
                tariff.isPopular
                  ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Batafsil
            </button>
          </div>
        ))}
      </div>

      {/* Modals */}
      <CreateTariffModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => {
          setTariffs([...tariffs, { ...data, id: tariffs.length + 1 }]);
        }}
      />

      <EditTariffModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        tariff={selectedTariff}
        onSubmit={(data) => {
          setTariffs(
            tariffs.map((tariff) =>
              tariff.id === data.id ? data : tariff
            )
          );
        }}
      />

      <DeleteTariffModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        tariff={selectedTariff}
        onConfirm={(id) => {
          setTariffs(tariffs.filter((tariff) => tariff.id !== id));
        }}
      />
    </div>
  );
};

export default Tariffs;
