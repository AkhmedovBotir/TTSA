// API Configuration
export const API_BASE_URL = 'https://api.ttsa.uz';
export const API_MOBILE_URL = `${API_BASE_URL}/api/shop-owner-mobile`;
export const API_URL = `${API_BASE_URL}/api`;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_MOBILE_URL}/login`,
  ME: `${API_MOBILE_URL}/me`,
  
  // Products
  PRODUCTS: {
    LIST: `${API_MOBILE_URL}/product/list`,
    CREATE: `${API_MOBILE_URL}/product/create`,
    UPDATE: (id: string) => `${API_MOBILE_URL}/product/${id}`,
    DELETE: (id: string) => `${API_MOBILE_URL}/product/${id}`,
    QUANTITY: (id: string) => `${API_MOBILE_URL}/product/${id}/quantity`,
    IMAGE: (imageName: string) => `${API_BASE_URL}/uploads/products/${imageName}`,
  },
  
  // Categories
  CATEGORIES: {
    LIST: `${API_MOBILE_URL}/category/list`,
    DETAIL: (id: string) => `${API_MOBILE_URL}/category/${id}`,
  },
  
  // Orders
  ORDERS: {
    LIST: `${API_MOBILE_URL}/orders`,
    DETAIL: (id: string) => `${API_MOBILE_URL}/orders/${id}`,
  },
  
  // Sellers
  SELLERS: {
    AVAILABLE: `${API_MOBILE_URL}/sellers/available`,
    MY: `${API_MOBILE_URL}/sellers/my`,
    ASSIGN: (id: string) => `${API_MOBILE_URL}/sellers/${id}/assign`,
    REMOVE: (id: string) => `${API_MOBILE_URL}/sellers/${id}/remove`,
    STATUS: (id: string) => `${API_MOBILE_URL}/sellers/${id}/status`,
    UPDATE: (id: string) => `${API_MOBILE_URL}/sellers/${id}`,
    SERVICE_AREAS: (id: string) => `${API_MOBILE_URL}/sellers/${id}/service-areas`,
  },
  
  // Regions
  REGIONS: {
    LIST: `${API_MOBILE_URL}/regions`,
    DISTRICTS: (regionId: string) => `${API_MOBILE_URL}/regions/${regionId}/districts`,
    MFYS: (districtId: string) => `${API_MOBILE_URL}/districts/${districtId}/mfys`,
  },
  
  // Statistics
  STATISTICS: {
    DASHBOARD: `${API_MOBILE_URL}/statistics/dashboard`,
    DAILY: `${API_MOBILE_URL}/statistics/daily`,
    WEEKLY: `${API_MOBILE_URL}/statistics/weekly`,
    MONTHLY: `${API_MOBILE_URL}/statistics/monthly`,
    SALES: `${API_MOBILE_URL}/statistics/sales`,
    SELLERS: `${API_MOBILE_URL}/statistics/sellers`,
    WAREHOUSE: `${API_MOBILE_URL}/statistics/warehouse`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: `${API_MOBILE_URL}/notifications`,
    UNREAD_COUNT: `${API_MOBILE_URL}/notifications/unread-count`,
    MARK_READ: (id: string) => `${API_MOBILE_URL}/notifications/${id}/read`,
  },
} as const;

// Helper function to create API request
export const createApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
};

// Helper function to create authenticated API request
export const createAuthenticatedApiRequest = async (
  endpoint: string, 
  token: string, 
  options: RequestInit = {}
) => {
  return createApiRequest(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
};

// Export default API configuration
export default {
  BASE_URL: API_BASE_URL,
  MOBILE_URL: API_MOBILE_URL,
  URL: API_URL,
  ENDPOINTS: API_ENDPOINTS,
  createRequest: createApiRequest,
  createAuthenticatedRequest: createAuthenticatedApiRequest,
};
