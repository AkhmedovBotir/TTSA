// Notification Types
export interface NotificationData {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  deliveryRate?: number | null;
  readRate?: number | null;
  id: string;
}

export interface Notification {
  _id: string;
  notification: NotificationData;
  user: string;
  userModel: string;
  status: 'sent' | 'read' | 'unread';
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  unreadCount: number;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: 'sent' | 'read' | 'unread';
  type?: 'info' | 'success' | 'warning' | 'error' | 'promotion';
}
