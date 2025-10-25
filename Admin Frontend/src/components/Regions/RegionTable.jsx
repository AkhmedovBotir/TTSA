import React, { useState } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, MapPinIcon, BuildingOfficeIcon, HomeIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const RegionTable = ({ 
  regions, 
  onView, 
  onEdit, 
  onDelete, 
  loading = false 
}) => {
  const [expandedRegions, setExpandedRegions] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'inactive':
        return 'Faol emas';
      default:
        return status || 'Noma\'lum';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'region':
        return 'Viloyat';
      case 'district':
        return 'Tuman';
      case 'mfy':
        return 'MFY';
      default:
        return type || 'Noma\'lum';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'region':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'district':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'mfy':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'region':
        return <MapPinIcon className="h-4 w-4" />;
      case 'district':
        return <BuildingOfficeIcon className="h-4 w-4" />;
      case 'mfy':
        return <HomeIcon className="h-4 w-4" />;
      default:
        return <MapPinIcon className="h-4 w-4" />;
    }
  };

  // Organize regions hierarchically
  const organizeRegions = () => {
    const regionsList = regions.filter(r => r.type === 'region');
    const districtsList = regions.filter(r => r.type === 'district');
    const mfysList = regions.filter(r => r.type === 'mfy');

    return regionsList.map(region => ({
      ...region,
      districts: districtsList
        .filter(district => district.parent?.id === region.id)
        .map(district => ({
          ...district,
          mfys: mfysList.filter(mfy => mfy.parent?.id === district.id)
        }))
    }));
  };

  const toggleRegion = (regionId) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionId)) {
      newExpanded.delete(regionId);
    } else {
      newExpanded.add(regionId);
    }
    setExpandedRegions(newExpanded);
  };

  const toggleDistrict = (districtId) => {
    const newExpanded = new Set(expandedDistricts);
    if (newExpanded.has(districtId)) {
      newExpanded.delete(districtId);
    } else {
      newExpanded.add(districtId);
    }
    setExpandedDistricts(newExpanded);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Regionlar ro'yxati</h3>
        </div>
        <div className="p-12 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-500">Ma'lumotlar yuklanmoqda...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPinIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Regionlar ro'yxati</h3>
              <p className="text-sm text-gray-500">Barcha regionlar va ularning ma'lumotlari</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Jami: {regions.length} ta
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {regions.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Hech qanday region topilmadi
          </div>
        ) : (
          organizeRegions().map((region) => (
            <div key={region.id} className="bg-white">
              {/* Region Row */}
              <div className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleRegion(region.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                    >
                      {expandedRegions.has(region.id) ? (
                        <ChevronDownIcon className="h-5 w-5" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5" />
                      )}
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getTypeIcon(region.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {region.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {region.districts.length} ta tuman
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(region.type)}`}>
                      <span className="mr-1">{getTypeIcon(region.type)}</span>
                      {getTypeText(region.type)}
                    </span>
                    
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(region.status)}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        region.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      {getStatusText(region.status)}
                    </span>
                    
                    <div className="text-sm text-gray-500 font-mono">
                      {region.code}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onView(region)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-sm"
                        title="Ko'rish"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => onEdit(region)}
                        className="text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-sm"
                        title="Tahrirlash"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => onDelete(region)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-sm"
                        title="O'chirish"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Districts */}
              {expandedRegions.has(region.id) && (
                <div className="bg-gray-50 border-l-4 border-blue-200">
                  {region.districts.map((district) => (
                    <div key={district.id} className="border-b border-gray-200 last:border-b-0">
                      {/* District Row */}
                      <div className="px-12 py-3 hover:bg-gray-100 transition-colors duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => toggleDistrict(district.id)}
                              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            >
                              {expandedDistricts.has(district.id) ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {getTypeIcon(district.type)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {district.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {district.mfys.length} ta MFY
                                  </div>
                                </div>
                              </div>
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(district.type)}`}>
                              <span className="mr-1">{getTypeIcon(district.type)}</span>
                              {getTypeText(district.type)}
                            </span>
                            
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(district.status)}`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                district.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                              }`}></div>
                              {getStatusText(district.status)}
                            </span>
                            
                            <div className="text-sm text-gray-500 font-mono">
                              {district.code}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => onView(district)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-sm"
                                title="Ko'rish"
                              >
                                <EyeIcon className="h-3 w-3" />
                              </button>
                              
                              <button
                                onClick={() => onEdit(district)}
                                className="text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-sm"
                                title="Tahrirlash"
                              >
                                <PencilIcon className="h-3 w-3" />
                              </button>
                              
                              <button
                                onClick={() => onDelete(district)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-sm"
                                title="O'chirish"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* MFYs */}
                      {expandedDistricts.has(district.id) && (
                        <div className="bg-white border-l-4 border-green-200">
                          {district.mfys.map((mfy) => (
                            <div key={mfy.id} className="px-20 py-2 hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    {getTypeIcon(mfy.type)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {mfy.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      MFY
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(mfy.type)}`}>
                                    <span className="mr-1">{getTypeIcon(mfy.type)}</span>
                                    {getTypeText(mfy.type)}
                                  </span>
                                  
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(mfy.status)}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                      mfy.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                                    }`}></div>
                                    {getStatusText(mfy.status)}
                                  </span>
                                  
                                  <div className="text-xs text-gray-500 font-mono">
                                    {mfy.code}
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => onView(mfy)}
                                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-sm"
                                      title="Ko'rish"
                                    >
                                      <EyeIcon className="h-3 w-3" />
                                    </button>
                                    
                                    <button
                                      onClick={() => onEdit(mfy)}
                                      className="text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-sm"
                                      title="Tahrirlash"
                                    >
                                      <PencilIcon className="h-3 w-3" />
                                    </button>
                                    
                                    <button
                                      onClick={() => onDelete(mfy)}
                                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-sm"
                                      title="O'chirish"
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default RegionTable;

