import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CreateRegionModal = ({ isOpen, onClose, onSubmit, parentRegions = [], regionType = 'region' }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: regionType,
    code: '',
    parent: '',
    status: 'active'
  });
  const [error, setError] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Update form data when regionType changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type: regionType,
      parent: '' // Reset parent when type changes
    }));
    setSelectedRegion(''); // Reset selected region when type changes
  }, [regionType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'selectedRegion') {
      setSelectedRegion(value);
      setFormData(prev => ({
        ...prev,
        parent: '' // Reset parent when region changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Nomi kiritilishi shart');
        return;
      }
      
      if (!formData.code.trim()) {
        setError('Kod kiritilishi shart');
        return;
      }
      
      // Validate parent field for district and mfy
      if (regionType === 'district' && !formData.parent) {
        setError('Viloyat tanlanishi shart');
        return;
      }
      
      if (regionType === 'mfy') {
        if (!selectedRegion) {
          setError('Viloyat tanlanishi shart');
          return;
        }
        if (!formData.parent) {
          setError('Tuman tanlanishi shart');
          return;
        }
      }

      // Prepare data for API
      const submitData = {
        name: formData.name.trim(),
        type: regionType,
        code: formData.code.trim(),
        status: formData.status
      };

      // Only include parent if it's selected
      if (formData.parent) {
        // Find the parent object to get more details
        const parentObject = getParentOptions().find(p => p.id === formData.parent);
        if (parentObject) {
          submitData.parent = parentObject.id;
          // Some APIs might expect parent object instead of just ID
          // submitData.parent = parentObject;
        }
      }

      console.log('Form data being submitted:', submitData);
      console.log('Form data state:', formData);

      await onSubmit(submitData);
      
      // Reset form
      setFormData({
        name: '',
        type: 'region',
        code: '',
        parent: '',
        status: 'active'
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const getTypeOptions = () => {
    const options = [
      { value: 'region', label: 'Viloyat' },
      { value: 'district', label: 'Tuman' },
      { value: 'mfy', label: 'MFY' }
    ];
    return options;
  };

  const getParentOptions = () => {
    if (regionType === 'region') {
      return []; // Regions don't have parents
    }
    
    if (regionType === 'district') {
      return parentRegions.filter(region => region.type === 'region');
    }
    
    if (regionType === 'mfy') {
      if (selectedRegion) {
        // Filter districts by selected region
        return parentRegions.filter(region => 
          region.type === 'district' && 
          region.parent && 
          region.parent.id === selectedRegion
        );
      }
      return []; // No districts shown until region is selected
    }
    
    return [];
  };

  // Debug log to see what parentRegions contains
  console.log('=== CreateRegionModal Debug ===');
  console.log('parentRegions:', parentRegions);
  console.log('parentRegions.length:', parentRegions.length);
  console.log('regionType:', regionType);
  console.log('formData.type:', formData.type);
  console.log('selectedRegion:', selectedRegion);
  console.log('getParentOptions():', getParentOptions());
  console.log('getParentOptions().length:', getParentOptions().length);
  console.log('Regions in parentRegions:', parentRegions.filter(r => r.type === 'region'));
  console.log('Districts in parentRegions:', parentRegions.filter(r => r.type === 'district'));
  console.log('Should show parent field:', regionType === 'district' || regionType === 'mfy');
  console.log('=== End Debug ===');

  if (!isOpen) return null;

  return (
    <Dialog as="div" className="relative z-50" onClose={onClose} open={isOpen}>
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="text-center mb-4">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                {regionType === 'region' && 'Yangi viloyat qo\'shish'}
                {regionType === 'district' && 'Yangi tuman qo\'shish'}
                {regionType === 'mfy' && 'Yangi MFY qo\'shish'}
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {regionType === 'region' && 'Viloyat nomi *'}
                  {regionType === 'district' && 'Tuman nomi *'}
                  {regionType === 'mfy' && 'MFY nomi *'}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder={
                    regionType === 'region' ? 'Masalan: Andijon viloyati' :
                    regionType === 'district' ? 'Masalan: Andijon tumani' :
                    'Masalan: Bog\'ishamol MFY'
                  }
                  required
                />
              </div>

              {/* Type is now determined by the button clicked, so we hide this field */}
              <input type="hidden" name="type" value={formData.type} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region kodi *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm font-mono"
                  placeholder={
                    regionType === 'region' ? 'Masalan: AND' :
                    regionType === 'district' ? 'Masalan: AND001' :
                    'Masalan: AND001001'
                  }
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique kod bo'lishi kerak
                </p>
              </div>

              {regionType === 'district' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Viloyat tanlang *
                  </label>
                  <select
                    name="parent"
                    value={formData.parent}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  >
                    <option value="">Viloyat tanlang</option>
                    {getParentOptions().map(region => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                  {getParentOptions().length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Viloyatlar topilmadi
                    </p>
                  )}
                </div>
              )}

              {regionType === 'mfy' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Viloyat tanlang *
                    </label>
                    <select
                      name="selectedRegion"
                      value={selectedRegion}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    >
                      <option value="">Viloyat tanlang</option>
                      {parentRegions.filter(region => region.type === 'region').map(region => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedRegion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tuman tanlang *
                      </label>
                      <select
                        name="parent"
                        value={formData.parent}
                        onChange={handleChange}
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      >
                        <option value="">Tuman tanlang</option>
                        {getParentOptions().map(region => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                      {getParentOptions().length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Bu viloyatda tumanlar topilmadi
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holati *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  required
                >
                  <option value="active">Faol</option>
                  <option value="inactive">Faol emas</option>
                </select>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateRegionModal;

