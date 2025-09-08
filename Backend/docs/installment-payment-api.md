# Installment Payment API Documentation

## Overview
The installment payment system allows sellers to create installment-based orders for customers. Customers can pay for products over time in monthly installments.

## Features
- Create installment orders with customer registration
- Multiple installment durations (2, 3, 4, 5, 6, 10, 12 months)
- Automatic payment schedule generation
- Payment tracking and status management
- Customer information management
- Product inventory management

## Base URL
```
/api/installment-payment
```

## Authentication
All endpoints require authentication using the `sellerMobileAuth` middleware. Include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Create Installment Order
**POST** `/create`

Creates a new installment payment order with customer registration.

#### Request Body
```json
{
  "products": [
    {
      "productId": "product_id_here",
      "name": "Product Name",
      "quantity": 2,
      "price": 50000,
      "unit": "dona",
      "unitSize": 1
    }
  ],
  "customer": {
    "fullName": "John Doe",
    "birthDate": "1990-01-01",
    "passportSeries": "AA1234567",
    "primaryPhone": "+998901234567",
    "secondaryPhone": "+998901234568",
    "image": "path/to/customer/image.jpg"
  },
  "installmentDuration": 6
}
```

#### Response
```json
{
  "success": true,
  "message": "Muddatli to'lov buyurtmasi muvaffaqiyatli yaratildi",
  "installmentPayment": {
    "orderId": 1001,
    "totalSum": 100000,
    "customer": {
      "fullName": "John Doe",
      "birthDate": "1990-01-01T00:00:00.000Z",
      "passportSeries": "AA1234567",
      "primaryPhone": "+998901234567",
      "secondaryPhone": "+998901234568",
      "image": "path/to/customer/image.jpg"
    },
    "installment": {
      "duration": 6,
      "monthlyPayment": 16667,
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-07-15T10:30:00.000Z"
    },
    "status": "active",
    "payments": [
      {
        "month": 1,
        "amount": 16667,
        "dueDate": "2024-02-15T10:30:00.000Z",
        "status": "pending"
      }
      // ... more payment months
    ]
  }
}
```

### 2. Get Seller's Installment Payments
**GET** `/list`

Retrieves all installment payments for the authenticated seller.

#### Query Parameters
- `status` (optional): Filter by status (`active`, `completed`, `overdue`, `cancelled`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)

#### Response
```json
{
  "success": true,
  "installments": [
    {
      "_id": "installment_id",
      "orderId": 1001,
      "totalSum": 100000,
      "customer": {
        "fullName": "John Doe",
        "primaryPhone": "+998901234567"
      },
      "installment": {
        "duration": 6,
        "monthlyPayment": 16667
      },
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### 3. Get Installment by ID
**GET** `/:installmentId`

Retrieves detailed information about a specific installment payment.

#### Response
```json
{
  "success": true,
  "installment": {
    "_id": "installment_id",
    "orderId": 1001,
    "totalSum": 100000,
    "customer": {
      "fullName": "John Doe",
      "birthDate": "1990-01-01T00:00:00.000Z",
      "passportSeries": "AA1234567",
      "primaryPhone": "+998901234567",
      "secondaryPhone": "+998901234568",
      "image": "path/to/customer/image.jpg"
    },
    "products": [
      {
        "productId": {
          "_id": "product_id",
          "name": "Product Name",
          "image": "product_image.jpg"
        },
        "name": "Product Name",
        "quantity": 2,
        "price": 50000,
        "unit": "dona",
        "unitSize": 1
      }
    ],
    "installment": {
      "duration": 6,
      "monthlyPayment": 16667,
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-07-15T10:30:00.000Z"
    },
    "status": "active",
    "payments": [
      {
        "month": 1,
        "amount": 16667,
        "dueDate": "2024-02-15T10:30:00.000Z",
        "status": "pending"
      }
    ]
  }
}
```

### 4. Record Payment
**POST** `/:installmentId/payment`

Records a payment for a specific month of an installment.

#### Request Body
```json
{
  "month": 1,
  "amount": 16667
}
```

#### Response
```json
{
  "success": true,
  "message": "To'lov muvaffaqiyatli qayd etildi",
  "installment": {
    "status": "active",
    "payments": [
      {
        "month": 1,
        "amount": 16667,
        "dueDate": "2024-02-15T10:30:00.000Z",
        "status": "paid",
        "paidAt": "2024-02-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 5. Cancel Installment
**PATCH** `/:installmentId/cancel`

Cancels an installment payment order.

#### Request Body
```json
{
  "reason": "Customer requested cancellation"
}
```

#### Response
```json
{
  "success": true,
  "message": "Muddatli to'lov muvaffaqiyatli bekor qilindi",
  "installment": {
    "status": "cancelled",
    "cancelledAt": "2024-01-16T10:30:00.000Z",
    "cancelReason": "Customer requested cancellation"
  }
}
```

### 6. Get Installment Statistics
**GET** `/stats/overview`

Retrieves statistics for the seller's installment payments.

#### Response
```json
{
  "success": true,
  "stats": {
    "total": 50,
    "active": 30,
    "overdue": 5,
    "breakdown": [
      {
        "_id": "active",
        "count": 30,
        "totalAmount": 3000000
      },
      {
        "_id": "completed",
        "count": 10,
        "totalAmount": 1000000
      },
      {
        "_id": "overdue",
        "count": 5,
        "totalAmount": 500000
      },
      {
        "_id": "cancelled",
        "count": 5,
        "totalAmount": 500000
      }
    ]
  }
}
```

## Updated Order Endpoints

### Draft Orders
The existing draft order endpoints now support installment payments:

#### Create Draft Order
**POST** `/api/draft-orders/drafts`
```json
{
  "products": [
    {
      "productId": "product_id_here",
      "name": "Product Name",
      "quantity": 2,
      "price": 50000,
      "unit": "dona",
      "unitSize": 1
    }
  ],
  "storeOwner": "store_id",
  "paymentMethod": "installment"  // New field: "cash", "card", or "installment"
}
```

#### Confirm Draft Order as Installment
**POST** `/api/draft-orders/drafts/:id/confirm`

Confirms a draft order as an installment payment. **REQUIRES** customer information and installment duration.

```json
{
  "paymentMethod": "installment",
  "installmentDuration": 6,
  "customer": {
    "fullName": "John Doe",
    "birthDate": "1990-01-01",
    "passportSeries": "AA1234567",
    "primaryPhone": "+998901234567",
    "secondaryPhone": "+998901234568",
    "image": "uploads/path/to/customer/image.jpg"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Muddatli to'lov muvaffaqiyatli tasdiqlandi",
  "data": {
    "orderId": 1001,
    "totalSum": 100000,
    "customer": {
      "fullName": "John Doe",
      "birthDate": "1990-01-01T00:00:00.000Z",
      "passportSeries": "AA1234567",
      "primaryPhone": "+998901234567",
      "secondaryPhone": "+998901234568",
      "image": "uploads/path/to/customer/image.jpg"
    },
    "installment": {
      "duration": 6,
      "monthlyPayment": 16667,
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-07-15T10:30:00.000Z"
    },
    "status": "active",
    "payments": [
      {
        "month": 1,
        "amount": 16667,
        "dueDate": "2024-02-15T10:30:00.000Z",
        "status": "pending"
      }
    ]
  }
}
```

#### Confirm Draft Order as Cash/Card
**POST** `/api/draft-orders/drafts/:id/confirm`

Confirms a draft order as a regular payment (cash or card).

```json
{
  "paymentMethod": "cash"  // or "card"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli tasdiqlandi",
  "data": {
    "orderId": 1001,
    "totalSum": 100000,
    "paymentMethod": "cash",
    "status": "completed"
  }
}
```

### Direct Order Creation
The existing order history endpoints now support installment payments:

#### Create Direct Installment Order
**POST** `/api/order-history`
```json
{
  "products": [
    {
      "productId": "product_id_here",
      "name": "Product Name",
      "quantity": 2,
      "price": 50000,
      "unit": "dona",
      "unitSize": 1
    }
  ],
  "storeOwner": "store_id",
  "paymentMethod": "installment",
  "installmentDuration": 6,
  "customer": {
    "fullName": "John Doe",
    "birthDate": "1990-01-01",
    "passportSeries": "AA1234567",
    "primaryPhone": "+998901234567",
    "secondaryPhone": "+998901234568",
    "image": "uploads/path/to/customer/image.jpg"
  }
}
```

#### Create Direct Cash/Card Order
**POST** `/api/order-history`
```json
{
  "products": [
    {
      "productId": "product_id_here",
      "name": "Product Name",
      "quantity": 2,
      "price": 50000,
      "unit": "dona",
      "unitSize": 1
    }
  ],
  "storeOwner": "store_id",
  "paymentMethod": "cash"  // or "card"
}
```

## Data Models

### InstallmentPayment Schema
```javascript
{
  orderId: Number,           // Unique order identifier
  seller: ObjectId,          // Reference to Seller
  storeOwner: ObjectId,      // Reference to ShopOwner
  products: [Product],       // Array of products
  totalSum: Number,          // Total order amount
  
  customer: {
    fullName: String,        // Customer's full name
    birthDate: Date,         // Customer's birth date
    passportSeries: String,  // Passport series (AA1234567 format)
    primaryPhone: String,    // Primary phone number (+998 format)
    secondaryPhone: String,  // Secondary phone number (optional)
    image: String            // Customer's image path
  },
  
  installment: {
    duration: Number,        // Duration in months (2,3,4,5,6,10,12)
    monthlyPayment: Number,  // Calculated monthly payment amount
    startDate: Date,         // Installment start date
    endDate: Date            // Installment end date
  },
  
  status: String,            // active, completed, overdue, cancelled
  payments: [Payment],       // Array of monthly payments
  
  completedAt: Date,         // Completion date
  cancelledAt: Date,         // Cancellation date
  cancelledBy: ObjectId,     // Who cancelled the order
  cancelReason: String       // Reason for cancellation
}
```

### Payment Schema
```javascript
{
  month: Number,             // Month number (1, 2, 3, ...)
  amount: Number,            // Payment amount for this month
  dueDate: Date,             // Due date for this payment
  paidAt: Date,              // When payment was made
  status: String             // pending, paid, overdue
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description in Uzbek",
  "error": "Technical error details"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Common Error Messages

### For Installment Payments:
- `"Muddatli to'lov uchun mijoz ma'lumotlari to'liq kiritilishi shart"` - Missing customer information
- `"Noto'g'ri muddatli to'lov muddati"` - Invalid installment duration (must be 2,3,4,5,6,10,12)
- `"Do'kon egasi topilmadi"` - Shop owner not found
- `"Mahsulot yetarli emas"` - Insufficient product quantity

### For Regular Orders:
- `"Kamida bitta mahsulot kiritilishi kerak"` - No products provided
- `"Do'kon egasi kiritilishi shart"` - Missing store owner
- `"Noto'g'ri to'lov usuli"` - Invalid payment method

## Business Rules

1. **Installment Duration**: Only supports 2, 3, 4, 5, 6, 10, or 12 months
2. **Payment Schedule**: Automatically generated from the sale date
3. **Monthly Payment**: Calculated by dividing total amount by duration (rounded up)
4. **Product Inventory**: Automatically reduced when installment order is created
5. **Cancellation**: Products are returned to inventory when order is cancelled
6. **Status Updates**: Automatic status updates based on payment history
7. **Customer Registration**: Required for all installment orders

## Notes

- All monetary amounts are in Uzbek Som (UZS)
- Dates are in ISO 8601 format
- Phone numbers must be in Uzbek format (+998XXXXXXXXX)
- Passport series must be in format AA1234567 (2 letters + 7 digits)
- Customer images are stored as file paths in the uploads directory
- **IMPORTANT**: When confirming draft orders as installments, you MUST include `customer` and `installmentDuration` fields
- Draft orders can be confirmed as either regular orders (cash/card) or installment payments
