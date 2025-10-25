import { getValidToken } from '../utils/auth';
import { getApiUrl, API_CONFIG } from '../config/api';

export interface LocationItem {
  _id: string;
  code: string;
  name: string;
  type?: string;
}

export interface LocationsResponse {
  success: boolean;
  data: LocationItem[];
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  notification: Notification;
  status: 'sent' | 'delivered' | 'read';
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: NotificationItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export interface NotificationReadResponse {
  success: boolean;
  message: string;
  data: NotificationItem;
}

export interface MarketplaceOrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    image: string;
    category: {
      _id: string;
      id: string;
      name: string;
    };
    subcategory: {
      _id: string;
      id: string;
      name: string;
    };
    unit: string;
    unitSize: number;
    shop: {
      _id: string;
      name: string;
      address?: string;
      phone?: string;
    };
  };
  quantity: number;
  price: number;
  originalPrice: number;
  discount: number;
  totalPrice: number;
}

export interface Location {
  region: LocationItem;
  district: LocationItem;
  mfy: LocationItem;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  items: MarketplaceOrderItem[];
  totalPrice: number;
  totalOriginalPrice?: number;
  totalDiscount?: number;
  itemCount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'installment';
  deliveryAddress: {
    fullName: string;
    phone: string;
    address: string;
  };
  deliveryNotes?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  location?: Location;
  user: {
    _id: string;
    fullName?: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  success: boolean;
  data: {
    orders: MarketplaceOrder[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface OrderResponse {
  success: boolean;
  data: MarketplaceOrder;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    orderNumber: string;
    status: string;
    actualDelivery?: string;
    reason?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    confirmedAt?: string;
    rejectedAt?: string;
  };
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  regionId?: string;
  districtId?: string;
  mfyId?: string;
}

export class OrderService {
  private static async getAuthHeaders() {
    const token = await getValidToken();
    if (!token) {
      throw new Error('Avtorizatsiya tokeni topilmadi');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  static async getOrders(params: GetOrdersParams = {}): Promise<OrdersResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
      if (params.regionId) queryParams.append('regionId', params.regionId);
      if (params.districtId) queryParams.append('districtId', params.districtId);
      if (params.mfyId) queryParams.append('mfyId', params.mfyId);

      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.SELLER_ORDERS)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('=== ORDER SERVICE GET ORDERS ===');
      console.log('URL:', url);
      console.log('Headers:', headers);
      console.log('Params:', params);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('=== ORDER SERVICE RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);

      const data = await response.json();
      console.log('Response Data:', data);
      
      // Log location data if present
      if (data.data?.orders) {
        console.log('Total orders received:', data.data.orders.length);
        data.data.orders.forEach((order: any, index: number) => {
          if (order.location) {
            console.log(`Order ${index + 1} (ID: ${order.id}) location:`, {
              region: order.location.region?.name || 'N/A',
              district: order.location.district?.name || 'N/A',
              mfy: order.location.mfy?.name || 'N/A'
            });
          } else {
            console.log(`Order ${index + 1} (ID: ${order.id}): No location data`);
          }
        });
      } else {
        console.log('No orders data found in response');
      }

      if (!response.ok) {
        console.log('Response not OK:', response.status, data);
        throw new Error(data.message || 'Buyurtmalarni olishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  static async getOrderById(orderId: string): Promise<OrderResponse> {
    try {
      console.log('=== GET ORDER BY ID CALLED ===');
      console.log('Order ID:', orderId);
      
      const headers = await this.getAuthHeaders();
      console.log('Headers prepared:', headers);
      
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.SELLER_ORDERS)}/${orderId}`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('=== ORDER DATA RESPONSE ===');
      console.log('Full response data:', JSON.stringify(data, null, 2));
      
      // Log location data if present
      if (data.data?.location) {
        console.log('Order location data:', {
          region: data.data.location.region?.name || 'N/A',
          district: data.data.location.district?.name || 'N/A',
          mfy: data.data.location.mfy?.name || 'N/A'
        });
      } else {
        console.log('No location data found in response');
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Buyurtma topilmadi');
        }
        throw new Error(data.message || 'Buyurtmani olishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  static async acceptOrder(orderId: string): Promise<ActionResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.SELLER_ORDERS)}/${orderId}/accept`, {
        method: 'PATCH',
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Buyurtmani qabul qilishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error accepting order:', error);
      throw error;
    }
  }

  static async markAsDelivered(orderId: string): Promise<ActionResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.SELLER_ORDERS)}/${orderId}/deliver`, {
        method: 'PATCH',
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Buyurtmani yetkazildi deb belgilashda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      throw error;
    }
  }

  static async cancelOrder(orderId: string, reason: string): Promise<ActionResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.SELLER_ORDERS)}/${orderId}/cancel`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Buyurtmani bekor qilishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  static async confirmPayment(orderId: string, paymentMethod: string, notes?: string): Promise<ActionResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.SELLER_ORDERS)}/${orderId}/confirm-payment`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ paymentMethod, notes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'To\'lovni tasdiqlashda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  static async rejectPayment(orderId: string, reason: string): Promise<ActionResponse> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.SELLER_ORDERS)}/${orderId}/reject-payment`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'To\'lovni rad etishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error rejecting payment:', error);
      throw error;
    }
  }

  // Location Services
  static async getRegions(): Promise<LocationsResponse> {
    try {
      console.log('=== FETCHING REGIONS ===');
      const url = getApiUrl(API_CONFIG.ENDPOINTS.REGIONS);
      console.log('Regions URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Regions response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Hududlarni olishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  }

  static async getDistricts(regionId: string): Promise<LocationsResponse> {
    try {
      console.log('=== FETCHING DISTRICTS ===');
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.DISTRICTS)}/${regionId}/districts`;
      console.log('Districts URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Districts response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Tumanlarni olishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error fetching districts:', error);
      throw error;
    }
  }

  static async getMfys(districtId: string): Promise<LocationsResponse> {
    try {
      console.log('=== FETCHING MFYS ===');
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.MFYS)}/${districtId}/mfys`;
      console.log('MFYs URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      console.log('MFYs response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'MFYlarni olishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error fetching MFYs:', error);
      throw error;
    }
  }

  // Notification Services
  static async getNotifications(page: number = 1, limit: number = 10, status?: string): Promise<NotificationsResponse> {
    try {
      console.log('=== FETCHING NOTIFICATIONS ===');
      const headers = await this.getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (status) queryParams.append('status', status);

      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS)}?${queryParams.toString()}`;
      console.log('Notifications URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const data = await response.json();
      console.log('Notifications response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Xabarnomalarni olishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async getUnreadNotificationCount(): Promise<UnreadCountResponse> {
    try {
      console.log('=== FETCHING UNREAD COUNT ===');
      const headers = await this.getAuthHeaders();
      
      const url = getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
      console.log('Unread count URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const data = await response.json();
      console.log('Unread count response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'O\'qilmagan xabarnomalar sonini olishda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<NotificationReadResponse> {
    try {
      console.log('=== MARKING NOTIFICATION AS READ ===');
      const headers = await this.getAuthHeaders();
      
      const url = `${getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS)}/${notificationId}/read`;
      console.log('Mark as read URL:', url);

      const response = await fetch(url, {
        method: 'PATCH',
        headers
      });

      const data = await response.json();
      console.log('Mark as read response:', data);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Xabarnoma topilmadi');
        }
        throw new Error(data.message || 'Xabarnomani o\'qilgan deb belgilashda xatolik yuz berdi');
      }

      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}
