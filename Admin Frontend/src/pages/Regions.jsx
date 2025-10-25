import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Snackbar from '../components/Common/Snackbar';
import {
  RegionTable,
  CreateRegionModal,
  EditRegionModal,
  DeleteRegionModal,
  ViewRegionModal
} from '../components/Regions';

const Regions = () => {
  const [regions, setRegions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [createRegionType, setCreateRegionType] = useState('region');
  const [filters, setFilters] = useState({
    type: '',
    parent: ''
  });
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchRegions();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchRegions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      let url = 'https://api.ttsa.uz/api/admin/regions/list';
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.parent) params.append('parent', filters.parent);
      if (searchTerm) params.append('search', searchTerm);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri so\'rov');
        }
        throw new Error('Regionlarni yuklashda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Regionlarni yuklashda xatolik yuz berdi');
      }

      const mappedRegions = data.regions.map(region => ({
        id: region.id,
        name: region.name,
        type: region.type,
        code: region.code,
        parent: region.parent ? {
          id: region.parent._id,
          name: region.parent.name,
          type: region.parent.type
        } : null,
        status: region.status,
        createdAt: new Date(region.createdAt).toLocaleString('uz-UZ')
      }));

      setRegions(mappedRegions);
    } catch (error) {
      console.error('Error fetching regions:', error);
      setRegions([]);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRegion = async (regionData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }


      const response = await fetch('https://api.ttsa.uz/api/admin/regions/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(regionData)
      });

      if (!response.ok) {
        let errorMessage = 'Region yaratishda xatolik yuz berdi';
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 400) {
          // Try to get the actual error message from the response
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || 'Noto\'g\'ri so\'rov';
            console.error('API Error Response:', errorData);
            console.error('Request data that caused error:', regionData);
          } catch (e) {
            console.error('Could not parse error response:', e);
            errorMessage = 'Noto\'g\'ri so\'rov';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Region yaratishda xatolik yuz berdi');
      }

      setSnackbar({
        open: true,
        message: 'Region muvaffaqiyatli yaratildi',
        type: 'success'
      });

      fetchRegions();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating region:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleEditRegion = async (regionId, regionData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      const response = await fetch(`https://api.ttsa.uz/api/admin/regions/${regionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(regionData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 404) {
          throw new Error('Region topilmadi');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri so\'rov');
        }
        throw new Error('Regionni tahrirlashda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Regionni tahrirlashda xatolik yuz berdi');
      }

      setSnackbar({
        open: true,
        message: 'Region muvaffaqiyatli yangilandi',
        type: 'success'
      });

      fetchRegions();
    } catch (error) {
      console.error('Error editing region:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleDeleteRegion = async (regionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      const response = await fetch(`https://api.ttsa.uz/api/admin/regions/${regionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 404) {
          throw new Error('Region topilmadi');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri so\'rov');
        }
        throw new Error('Regionni o\'chirishda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Regionni o\'chirishda xatolik yuz berdi');
      }

      setSnackbar({
        open: true,
        message: 'Region muvaffaqiyatli o\'chirildi',
        type: 'success'
      });

      fetchRegions();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting region:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRegions();
  };

  const handleTypeFilter = (e) => {
    setFilters(prev => ({ ...prev, type: e.target.value }));
    setCurrentPage(1);
  };

  const handleParentFilter = (e) => {
    setFilters(prev => ({ ...prev, parent: e.target.value }));
    setCurrentPage(1);
  };

  const handleEdit = (region) => {
    setSelectedRegion(region);
    setShowEditModal(true);
  };

  const filteredRegions = regions.filter(region => {
    const searchMatch = (
      region.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const typeMatch = !filters.type || region.type === filters.type;
    const parentMatch = !filters.parent || region.parent?.id === filters.parent;
    
    return searchMatch && typeMatch && parentMatch;
  });

  const currentItems = filteredRegions;


  // Get parent regions for modal dropdowns
  const parentRegions = regions.filter(region => 
    region.type === 'region' || region.type === 'district'
  );
  

  return (
    <div className="container mx-auto px-4 py-6">
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        open={snackbar.open}
      />

      <div className="mb-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Regionlar
            </h2>
            <p className="text-sm text-gray-600 mt-1">Regionlar ro'yxati va boshqaruvi</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 md:ml-4 md:mt-0">
            <button
              onClick={() => {
                setCreateRegionType('region');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              Yangi viloyat
            </button>
            <button
              onClick={() => {
                setCreateRegionType('district');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              Yangi tuman
            </button>
            <button
              onClick={() => {
                setCreateRegionType('mfy');
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              Yangi MFY
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="sr-only">Qidiruv</label>
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-l-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Region nomi yoki kodi..."
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
          
          <div>
            <label htmlFor="type" className="sr-only">Turi</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleTypeFilter}
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
              disabled={loading}
            >
              <option value="">Barcha turlar</option>
              <option value="region">Viloyat</option>
              <option value="district">Tuman</option>
              <option value="mfy">MFY</option>
            </select>
          </div>

          <div>
            <label htmlFor="parent" className="sr-only">Parent</label>
            <select
              id="parent"
              name="parent"
              value={filters.parent}
              onChange={handleParentFilter}
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
              disabled={loading}
            >
              <option value="">Barcha parentlar</option>
              {parentRegions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Regions Table */}
      <RegionTable
        regions={currentItems}
        onView={(region) => {
          setSelectedRegion(region);
          setShowViewModal(true);
        }}
        onEdit={handleEdit}
        onDelete={(region) => {
          setSelectedRegion(region);
          setShowDeleteModal(true);
        }}
        loading={loading}
      />

      {/* Modals */}
      <CreateRegionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRegion}
        parentRegions={parentRegions}
        regionType={createRegionType}
      />

      <EditRegionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onEdit={handleEditRegion}
        region={selectedRegion}
        parentRegions={parentRegions}
      />

      <DeleteRegionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteRegion}
        region={selectedRegion}
      />

      <ViewRegionModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        region={selectedRegion}
      />
    </div>
  );
};

export default Regions;

