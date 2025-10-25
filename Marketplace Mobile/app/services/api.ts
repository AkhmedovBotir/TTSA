import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Base URL
const BASE_URL = 'https://api.ttsa.uz/api/user-mobile';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
  authStatus?: AuthStatus;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phoneNumber: string;
  username?: string;
  image?: string;
  isVerified?: boolean;
  isLoggedIn?: boolean;
  isPhoneVerified?: boolean;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  userType: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  };
  quantity: number;
  unit: string;
  unitSize: string;
  shop: {
    id: string;
    name: string;
    title?: string;
    address?: string;
    phone?: string;
    status?: string;
  };
  inStock: boolean;
  status: string;
  image: string;
  createdAt: string;
  isNew?: boolean;
  isTrend?: boolean;
  totalSold?: number;
  views?: number;
  trendScore?: number;
  deliveryRegions?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  originalPrice: number;
  discount: number;
  totalPrice: number;
  totalOriginalPrice: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalPrice: number;
  totalOriginalPrice: number;
  totalDiscount: number;
  itemCount: number;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  totalPrice: number;
  totalOriginalPrice: number;
  totalDiscount: number;
  itemCount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    address: string;
  };
  deliveryNotes?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: Pagination;
}

export interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'promotion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

export interface UserNotification {
  _id: string;
  notification: Notification;
  user: string;
  userModel: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  data: UserNotification[];
  pagination: Pagination;
}

export interface Region {
  _id: string;
  name: string;
  code: string;
  type?: string;
}

export interface District {
  _id: string;
  name: string;
  code: string;
  type?: string;
}

export interface Mfy {
  _id: string;
  name: string;
  code: string;
  type?: string;
}

export interface UserLocation {
  region: Region;
  district: District;
  mfy: Mfy;
}

export interface LocationResponse {
  location: UserLocation;
}

// API Service Class
class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await AsyncStorage.getItem('authToken');
          console.log('token', this.token);
        }
        
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // Set token manually
  setToken(token: string) {
    this.token = token;
    AsyncStorage.setItem('authToken', token);
  }

  // Clear token
  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }

  // Auth Methods
  async register(userData: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    password: string;
    username?: string;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/register', userData);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async login(credentials: {
    phoneNumber: string;
    password: string;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/login', credentials);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.api.post('/logout');
    await this.clearToken();
    return response.data;
  }

  async forgotPassword(data: {
    phoneNumber: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/forgot-password', data);
    return response.data;
  }

  // Profile Methods
  async getProfile(): Promise<ApiResponse> {
    const response = await this.api.get('/profile');
    return response.data;
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    username?: string;
  }): Promise<ApiResponse> {
    const response = await this.api.put('/profile', data);
    return response.data;
  }

  async changePassword(data: {
    newPassword: string;
  }): Promise<ApiResponse> {
    const response = await this.api.put('/change-password', data);
    return response.data;
  }

  // Products Methods
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    subcategory?: string;
    search?: string;
    searchType?: 'product' | 'shop';
    shop?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    inStock?: boolean;
    hasDiscount?: boolean;
    minDiscount?: number;
    maxDiscount?: number;
  }): Promise<ApiResponse<ProductsResponse>> {
    const response = await this.api.get('/products', { params });
    return response.data;
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    const response = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async getProductsByCategory(
    categoryId: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<{ category: any; products: Product[]; pagination: Pagination }>> {
    const response = await this.api.get(`/products/category/${categoryId}`, { params });
    return response.data;
  }

  async searchProducts(
    query: string,
    params?: {
      page?: number;
      limit?: number;
      searchType?: 'product' | 'shop';
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ApiResponse<ProductsResponse>> {
    const response = await this.api.get('/products/search', {
      params: { q: query, ...params }
    });
    return response.data;
  }

  async getDiscountedProducts(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<ProductsResponse>> {
    const response = await this.api.get('/products/discounted', { params });
    return response.data;
  }

  async getNewProducts(params?: {
    page?: number;
    limit?: number;
    days?: number;
  }): Promise<ApiResponse<ProductsResponse>> {
    const response = await this.api.get('/products/new', { params });
    return response.data;
  }

  async getTrendProducts(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ProductsResponse>> {
    const response = await this.api.get('/products/trend', { params });
    return response.data;
  }

  // Cart Methods
  async getCart(): Promise<ApiResponse<{ cart: Cart }>> {
    const response = await this.api.get('/cart');
    return response.data;
  }

  async addToCart(data: {
    productId: string;
    quantity: number;
  }): Promise<ApiResponse> {
    const response = await this.api.post('/cart/add', data);
    return response.data;
  }

  async updateCartItemQuantity(
    itemId: string,
    quantity: number
  ): Promise<ApiResponse> {
    const response = await this.api.put(`/cart/items/${itemId}/quantity`, {
      quantity
    });
    return response.data;
  }

  async removeFromCart(itemId: string): Promise<ApiResponse> {
    const response = await this.api.delete(`/cart/items/${itemId}`);
    return response.data;
  }

  async clearCart(): Promise<ApiResponse> {
    const response = await this.api.delete('/cart/clear');
    return response.data;
  }

  // Orders Methods
  async createOrder(data: {
    deliveryAddress: {
      fullName: string;
      phone: string;
      address: string;
      city?: string;
      postalCode?: string;
    };
    deliveryNotes?: string;
    paymentMethod?: string;
    estimatedDelivery?: string;
    location?: {
      regionId: string;
      districtId?: string;
      mfyId?: string;
    };
  }): Promise<ApiResponse<{ order: Order }>> {
    const response = await this.api.post('/orders', data);
    return response.data;
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
  }): Promise<ApiResponse<OrdersResponse>> {
    const response = await this.api.get('/orders', { params });
    return response.data;
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    const response = await this.api.get(`/orders/${orderId}`);
    return response.data;
  }

  async cancelOrder(orderId: string): Promise<ApiResponse> {
    const response = await this.api.put(`/orders/${orderId}/cancel`);
    return response.data;
  }

  async getOrderStats(): Promise<ApiResponse<{ data: OrderStats }>> {
    const response = await this.api.get('/orders/stats');
    return response.data;
  }

  // SMS Auth Methods (public)
  async sendSms(data: { phoneNumber: string; purpose?: 'login' | 'register' | 'reset_password' }): Promise<ApiResponse<{ phoneNumber: string; purpose: string; expiresIn: number; code?: string; note?: string }>> {
    const response = await this.api.post('/auth/send-sms', data);
    return response.data;
  }

  async verifySms(data: { phoneNumber: string; code: string; purpose?: 'login' | 'register' | 'reset_password' }): Promise<ApiResponse<{ phoneNumber: string; purpose: string; verifiedAt: string; token?: string; user?: User }>> {
    const response = await this.api.post('/auth/verify-sms', data);
    
    // If token is returned (for login purpose), set it automatically
    if (response.data?.data?.token) {
      this.setToken(response.data.data.token);
    }
    
    return response.data;
  }

  async registerWithSms(data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    username?: string;
    smsCode: string;
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await this.api.post('/auth/register-sms', data);
    if (response.data?.data?.token) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }
  // Location Methods
  async getRegions(): Promise<ApiResponse<Region[]>> {
    const response = await this.api.get('/regions');
    return response.data;
  }

  async getDistricts(regionId: string): Promise<ApiResponse<District[]>> {
    const response = await this.api.get(`/regions/${regionId}/districts`);
    return response.data;
  }

  async getMfys(districtId: string): Promise<ApiResponse<Mfy[]>> {
    const response = await this.api.get(`/districts/${districtId}/mfys`);
    return response.data;
  }

  async getUserLocation(): Promise<ApiResponse<LocationResponse>> {
    const response = await this.api.get('/location');
    return response.data;
  }

  async updateUserLocation(data: {
    regionId: string;
    districtId?: string;
    mfyId?: string;
  }): Promise<ApiResponse<LocationResponse>> {
    const response = await this.api.put('/location', data);
    return response.data;
  }

  // Notification Methods
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<UserNotification[]> & { unreadCount: number; pagination: Pagination }> {
    const response = await this.api.get('/notifications', { params });
    console.log('notifications', response.data);
    return response.data;
  }

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    const response = await this.api.get('/notifications/unread-count');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<UserNotification>> {
    const response = await this.api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
