# Admin Dashboard API Documentation

## Overview
The Admin Dashboard API provides comprehensive statistics and analytics for system administrators. It includes user statistics, financial data, performance metrics, and recent activities.

## Base URL
```
/api/admin
```

## Authentication
All dashboard endpoints require authentication using JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Required Permissions
- `view_dashboard` - Required to access dashboard statistics

---

## Endpoints

### 1. Get Admin Dashboard Statistics
**GET** `/statistics`

Retrieves comprehensive dashboard statistics including user counts, financial data, performance metrics, and recent activities.

#### Example Request
```http
GET /api/admin/statistics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalAdmins": 5,
      "totalSellers": 150,
      "totalAgents": 25,
      "totalShopOwners": 200,
      "totalClients": 870,
      "totalShops": 180,
      "totalProducts": 2500,
      "totalOrders": 3500,
      "totalInstallments": 1200
    },
    
    "users": {
      "admins": { "total": 5, "active": 4 },
      "sellers": { "total": 150, "active": 145 },
      "agents": { "total": 25, "active": 23 },
      "shopOwners": { "total": 200, "active": 195 },
      "clients": { "total": 870 }
    },
    
    "shops": {
      "total": 180,
      "active": 175,
      "inactive": 5
    },
    
    "products": {
      "total": 2500,
      "inStock": 2200,
      "lowStock": 150,
      "outOfStock": 150
    },
    
    "categories": {
      "total": 45
    },
    
    "regions": {
      "totalRegions": 12,
      "totalDistricts": 120,
      "totalMfys": 850,
      "total": 982
    },
    
    "orders": {
      "total": 3500,
      "today": 25,
      "monthly": 450,
      "yearly": 3500
    },
    
    "installments": {
      "total": 1200,
      "active": 800,
      "overdue": 50,
      "completed": 300,
      "cancelled": 50,
      "completionRate": 25
    },
    
    "revenue": {
      "today": 150000,
      "monthly": 2500000,
      "yearly": 15000000
    },
    
    "installmentFinancials": {
      "total": 5000000,
      "paid": 2000000,
      "pending": 3000000,
      "collectionRate": 40
    },
    
    "topPerformers": {
      "sellers": [
        {
          "id": "64a1b2c3d4e5f6789012345",
          "name": "Ahmad Karimov",
          "username": "ahmad_k",
          "totalInstallments": 45,
          "totalAmount": 2500000,
          "completed": 30,
          "completionRate": 67
        }
      ],
      "shopOwners": [
        {
          "id": "64a1b2c3d4e5f6789012346",
          "name": "Sardor Toshmatov",
          "username": "sardor_t",
          "phone": "+998901234567",
          "totalShops": 3,
          "totalProducts": 150
        }
      ]
    },
    
    "recentActivities": [
      {
        "id": "64a1b2c3d4e5f6789012347",
        "orderId": "ORD-2024-001",
        "seller": {
          "id": "64a1b2c3d4e5f6789012345",
          "name": "Ahmad Karimov",
          "username": "ahmad_k"
        },
        "shopOwner": {
          "id": "64a1b2c3d4e5f6789012346",
          "name": "Sardor Toshmatov",
          "username": "sardor_t"
        },
        "customer": {
          "fullName": "Bobur Aliyev",
          "phone": "+998901234567"
        },
        "totalAmount": 500000,
        "installmentMonths": 6,
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "message": "Statistika muvaffaqiyatli olindi"
}
```

#### Response Fields

##### Overview
- **totalUsers**: Total number of all users in the system
- **totalAdmins**: Total number of administrators
- **totalSellers**: Total number of sellers
- **totalAgents**: Total number of agents
- **totalShopOwners**: Total number of shop owners
- **totalClients**: Total number of clients
- **totalShops**: Total number of shops
- **totalProducts**: Total number of products
- **totalOrders**: Total number of orders
- **totalInstallments**: Total number of installment payments

##### Users
- **admins**: Admin statistics (total, active)
- **sellers**: Seller statistics (total, active)
- **agents**: Agent statistics (total, active)
- **shopOwners**: Shop owner statistics (total, active)
- **clients**: Total client count

##### Shops
- **total**: Total number of shops
- **active**: Number of active shops
- **inactive**: Number of inactive shops

##### Products
- **total**: Total number of products
- **inStock**: Number of products in stock
- **lowStock**: Number of products with low stock (< 10)
- **outOfStock**: Number of out-of-stock products

##### Categories
- **total**: Total number of product categories

##### Regions
- **totalRegions**: Number of regions
- **totalDistricts**: Number of districts
- **totalMfys**: Number of MFYs (Mahalla Fuqarolar Yig'ini)
- **total**: Total number of all regions

##### Orders
- **total**: Total number of orders
- **today**: Orders created today
- **monthly**: Orders created this month
- **yearly**: Orders created this year

##### Installments
- **total**: Total number of installment payments
- **active**: Number of active installments
- **overdue**: Number of overdue installments
- **completed**: Number of completed installments
- **cancelled**: Number of cancelled installments
- **completionRate**: Percentage of completed installments

##### Revenue
- **today**: Revenue generated today
- **monthly**: Revenue generated this month
- **yearly**: Revenue generated this year

##### Installment Financials
- **total**: Total installment amount
- **paid**: Amount already paid
- **pending**: Amount still pending
- **collectionRate**: Percentage of collected amount

##### Top Performers
- **sellers**: Top performing sellers by installment count
  - **id**: Seller ID
  - **name**: Seller full name
  - **username**: Seller username
  - **totalInstallments**: Total number of installments
  - **totalAmount**: Total amount handled
  - **completed**: Number of completed installments
  - **completionRate**: Completion percentage
- **shopOwners**: Top performing shop owners by shop count
  - **id**: Shop owner ID
  - **name**: Shop owner name
  - **username**: Shop owner username
  - **phone**: Shop owner phone
  - **totalShops**: Number of shops owned
  - **totalProducts**: Total products across all shops

##### Recent Activities
- **id**: Activity ID
- **orderId**: Related order ID
- **seller**: Seller information
- **shopOwner**: Shop owner information
- **customer**: Customer information
- **totalAmount**: Transaction amount
- **installmentMonths**: Number of installment months
- **status**: Current status
- **createdAt**: Creation timestamp

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token not provided or invalid"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Sizda statistikani ko'rish huquqi yo'q"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Serverda xatolik yuz berdi",
  "error": "Error details"
}
```

---

## Usage Examples

### Get Dashboard Statistics
```javascript
const response = await fetch('/api/admin/statistics', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const data = await response.json();

if (data.success) {
  console.log('Total Users:', data.data.overview.totalUsers);
  console.log('Today Revenue:', data.data.revenue.today);
  console.log('Top Sellers:', data.data.topPerformers.sellers);
}
```

### Display Key Metrics
```javascript
const displayDashboard = (data) => {
  const { overview, revenue, installments } = data.data;
  
  // Key metrics
  document.getElementById('total-users').textContent = overview.totalUsers;
  document.getElementById('today-revenue').textContent = revenue.today.toLocaleString();
  document.getElementById('completion-rate').textContent = installments.completionRate + '%';
  
  // Charts and graphs can be created using the detailed data
};
```

### Filter Recent Activities
```javascript
const filterRecentActivities = (activities, status) => {
  return activities.filter(activity => activity.status === status);
};

// Get only active installments
const activeInstallments = filterRecentActivities(
  data.data.recentActivities, 
  'active'
);
```

---

## Dashboard Widgets

### 1. **Overview Cards**
- Total Users
- Total Revenue
- Active Orders
- Completion Rate

### 2. **User Statistics Chart**
- Admin, Seller, Agent, Shop Owner, Client counts
- Active vs Inactive status

### 3. **Financial Overview**
- Daily, Monthly, Yearly revenue
- Installment collection rates
- Pending amounts

### 4. **Performance Metrics**
- Top performing sellers
- Top performing shop owners
- Completion rates

### 5. **Recent Activities Feed**
- Latest installment payments
- Order activities
- System events

---

## Best Practices

1. **Caching**: Consider caching dashboard data for better performance
2. **Real-time Updates**: Use WebSocket or polling for live updates
3. **Data Visualization**: Use charts and graphs for better data presentation
4. **Responsive Design**: Ensure dashboard works on all screen sizes
5. **Error Handling**: Always handle API errors gracefully
6. **Loading States**: Show loading indicators while fetching data

---

## Performance Considerations

- The dashboard aggregates data from multiple collections
- Consider implementing data caching for frequently accessed statistics
- Use pagination for large datasets (recent activities)
- Monitor database performance for complex aggregations

This API provides comprehensive dashboard functionality for system administrators with detailed statistics, performance metrics, and real-time insights into the platform's operations.

