# User Mobile Notification API Documentation

## Overview
The User Mobile Notification API provides endpoints for managing user notifications in the mobile application. Users can view their notifications, mark them as read, and get unread notification counts.

## Base URL
```
/api/user-mobile
```

## Authentication
All notification endpoints require authentication using JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Get User Notifications
**GET** `/notifications`

Retrieves paginated list of user notifications.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number for pagination |
| `limit` | integer | 20 | Number of notifications per page |
| `status` | string | - | Filter by notification status (`sent`, `delivered`, `read`, `failed`) |

#### Example Request
```http
GET /api/user-mobile/notifications?page=1&limit=10&status=unread
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Format
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "notification": {
        "_id": "64a1b2c3d4e5f6789012346",
        "title": "Yangi mahsulot",
        "message": "Sizning sevimli kategoriyangizda yangi mahsulotlar paydo bo'ldi",
        "type": "info",
        "priority": "medium",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      "user": "64a1b2c3d4e5f6789012347",
      "userModel": "Client",
      "status": "delivered",
      "deliveredAt": "2024-01-15T10:35:00.000Z",
      "readAt": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  },
  "unreadCount": 3
}
```

#### Response Fields
- **data**: Array of user notifications
  - **_id**: User notification ID
  - **notification**: Notification details object
    - **_id**: Notification ID
    - **title**: Notification title
    - **message**: Notification message
    - **type**: Notification type (`info`, `warning`, `success`, `error`, `promotion`)
    - **priority**: Priority level (`low`, `medium`, `high`, `urgent`)
    - **createdAt**: When notification was created
  - **user**: User ID
  - **userModel**: User model type (always "Client" for user mobile)
  - **status**: Notification status (`sent`, `delivered`, `read`, `failed`)
  - **deliveredAt**: When notification was delivered
  - **readAt**: When notification was read (null if not read)
  - **createdAt**: When user notification was created
  - **updatedAt**: When user notification was last updated
- **pagination**: Pagination information
- **unreadCount**: Total number of unread notifications

---

### 2. Get Unread Notification Count
**GET** `/notifications/unread-count`

Gets the total count of unread notifications for the user.

#### Example Request
```http
GET /api/user-mobile/notifications/unread-count
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

#### Response Fields
- **unreadCount**: Number of unread notifications (status is `sent` or `delivered`)

---

### 3. Mark Notification as Read
**PATCH** `/notifications/:notificationId/read`

Marks a specific notification as read.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notificationId` | string | Yes | ID of the notification to mark as read |

#### Example Request
```http
PATCH /api/user-mobile/notifications/64a1b2c3d4e5f6789012345/read
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Xabarnoma o'qilgan deb belgilandi",
  "data": {
    "_id": "64a1b2c3d4e5f6789012345",
    "notification": "64a1b2c3d4e5f6789012346",
    "user": "64a1b2c3d4e5f6789012347",
    "userModel": "Client",
    "status": "read",
    "deliveredAt": "2024-01-15T10:35:00.000Z",
    "readAt": "2024-01-15T11:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### Error Responses

##### 400 Bad Request - Invalid ObjectId Format
```json
{
  "success": false,
  "message": "Noto'g'ri xabarnoma ID formati"
}
```

##### 404 Not Found - Notification Not Found
```json
{
  "success": false,
  "message": "Xabarnoma topilmadi yoki sizga tegishli emas",
  "debug": {
    "notificationId": "68fbc1d7e3c0accc39e3439d",
    "userId": "68fb412af0c0e2f398b1d3d8",
    "userModel": "Client",
    "notificationExists": false,
    "userNotificationCount": 4,
    "userNotificationIds": [
      "68fbc52ad5c28eb61e949f38",
      "68fbc52ad5c28eb61e949f39",
      "68fbc52ad5c28eb61e949f40"
    ]
  }
}
```

##### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Xabarnoma holatini yangilashda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Error Responses

### Common Error Codes

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token not provided or invalid"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Xabarnomalarni olishda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Notification Types

| Type | Description | Use Case |
|------|-------------|----------|
| `info` | General information | System updates, general announcements |
| `warning` | Important warnings | Account issues, payment warnings |
| `success` | Success messages | Order confirmations, successful actions |
| `error` | Error notifications | Failed transactions, system errors |
| `promotion` | Promotional content | Sales, discounts, special offers |

## Notification Priority

| Priority | Description | Display Behavior |
|-----------|-------------|------------------|
| `low` | Low priority | Normal display |
| `medium` | Medium priority | Slightly emphasized |
| `high` | High priority | Emphasized display |
| `urgent` | Urgent priority | Maximum emphasis, immediate attention |

## Notification Status Flow

```
sent → delivered → read
  ↓
failed
```

- **sent**: Notification has been sent to the user
- **delivered**: Notification has been delivered to user's device
- **read**: User has read the notification
- **failed**: Notification delivery failed

---

## Usage Examples

### Get First Page of Notifications
```javascript
const response = await fetch('/api/user-mobile/notifications?page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const data = await response.json();
```

### Get Unread Count for Badge
```javascript
const response = await fetch('/api/user-mobile/notifications/unread-count', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const { data } = await response.json();
console.log('Unread notifications:', data.unreadCount);
```

### Mark Notification as Read
```javascript
const response = await fetch('/api/user-mobile/notifications/64a1b2c3d4e5f6789012345/read', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});
const result = await response.json();
```

### Handle 404 Error with Debug Information
```javascript
const response = await fetch('/api/user-mobile/notifications/68fbc1d7e3c0accc39e3439d/read', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});

if (!response.ok) {
  const error = await response.json();
  if (error.debug && error.debug.userNotificationIds) {
    // Use one of the valid notification IDs
    const validId = error.debug.userNotificationIds[0];
    console.log('Try with valid ID:', validId);
  }
}
```

---

## Debugging 404 Errors

When you get a 404 error for marking notifications as read, the response includes debug information:

### Debug Fields
- **notificationId**: The ID you're trying to mark as read
- **userId**: The current user's ID
- **userModel**: Should be "Client" for user mobile
- **notificationExists**: Whether the notification exists in the database
- **userNotificationCount**: How many notifications the user has total
- **userNotificationIds**: Array of valid notification IDs for this user

### Common Causes of 404
1. **Wrong Notification ID**: Using an ID that doesn't exist
2. **Notification Not Sent**: The notification was never sent to this user
3. **User Model Mismatch**: The notification was sent with wrong userModel
4. **Authentication Issue**: User ID doesn't match

### Solution
Use one of the notification IDs from the `userNotificationIds` array in the debug response.

---

## Best Practices

1. **Pagination**: Always use pagination for notification lists to improve performance
2. **Unread Count**: Use the unread count endpoint to show notification badges
3. **Status Filtering**: Use status filtering to show only relevant notifications
4. **Error Handling**: Always handle 404 errors when marking notifications as read
5. **Real-time Updates**: Consider implementing WebSocket or polling for real-time notification updates
6. **Debug Information**: Use the debug information in 404 responses to find valid notification IDs

---

## Server-Side Debugging

The server logs include detailed debugging information:

```
Mark as read request: {
  notificationId: '68fbc1d7e3c0accc39e3439d',
  userId: new ObjectId('68fb412af0c0e2f398b1d3d8'),
  userModel: 'Client'
}
Request params: { notificationId: '68fbc1d7e3c0accc39e3439d' }
Request user: { userId: '68fb412af0c0e2f398b1d3d8', ... }
Existing UserNotification: null
Notification exists: false
User has notifications: 4
User notification IDs: ['68fbc52ad5c28eb61e949f38', '68fbc52ad5c28eb61e949f39']
```

This API provides a complete notification system for the user mobile application with proper pagination, status tracking, error handling, and comprehensive debugging information.

