// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.ttsa.uz',
  ENDPOINTS: {
    // Seller Mobile API
    SELLER_LOGIN: '/api/seller-mobile/login',
    SELLER_ORDERS: '/api/seller-mobile/orders',
    SELLER_PRODUCTS: '/api/seller-mobile/products',
    INTEREST_RATES: '/api/seller-mobile/interest-rates',
    REGIONS: '/api/seller-mobile/regions',
    DISTRICTS: '/api/seller-mobile/regions',
    MFYS: '/api/seller-mobile/districts',
    NOTIFICATIONS: '/api/seller-mobile/notifications',
    NOTIFICATIONS_UNREAD_COUNT: '/api/seller-mobile/notifications/unread-count',
    
    // Order History API
    ORDER_HISTORY: '/api/order-history',
    ORDER_HISTORY_DIRECT: '/api/order-history/direct-order',
    
    // Draft Orders API
    DRAFT_ORDERS: '/api/draft-orders/drafts',
    
    // Uploads
    UPLOADS_PRODUCTS: '/uploads/products',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get upload URL
export const getUploadUrl = (path: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOADS_PRODUCTS}/${path}`;
};
