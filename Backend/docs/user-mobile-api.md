# User Mobile API Documentation

## Base URL
```
http://localhost:5000/api/user-mobile
```

## Authentication
Protected endpoints require authentication using JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## User Mobile Endpoints

### 1. User Registration
Register a new user account.

**URL:** `/user-mobile/register`  
**Method:** `POST`  
**Auth Required:** No

**Request Body:**
```json
{
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+998901234567",
    "password": "123456"
}
```

**Success Response:**
- **Code:** 201 Created
```json
{
    "success": true,
    "message": "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi va tizimga kirildi",
    "user": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+998901234567",
        "isVerified": true,
        "image": null
    },
    "token": "jwt_token_here"
}
```

### 2. User Login
Login with phone number and password.

**URL:** `/user-mobile/login`  
**Method:** `POST`  
**Auth Required:** No

**Request Body:**
```json
{
    "phoneNumber": "+998901234567",
    "password": "123456"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Muvaffaqiyatli kirildi",
    "user": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+998901234567",
        "isVerified": true,
        "image": "profile_image_url",
        "lastLogin": "2024-02-20T10:00:00.000Z"
    },
    "token": "jwt_token_here"
}
```

### 3. Send Verification Code
Send verification code to phone number.

**URL:** `/user-mobile/send-verification-code`  
**Method:** `POST`  
**Auth Required:** No

**Request Body:**
```json
{
    "phoneNumber": "+998901234567"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Tasdiqlash kodi yuborildi",
    "expiresIn": "10 daqiqa"
}
```

### 4. Verify Code
Verify phone number with received code.

**URL:** `/user-mobile/verify-code`  
**Method:** `POST`  
**Auth Required:** No

**Request Body:**
```json
{
    "phoneNumber": "+998901234567",
    "code": "123456"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Telefon raqam muvaffaqiyatli tasdiqlandi"
}
```

### 5. Forgot Password
Reset password for forgotten account.

**URL:** `/user-mobile/forgot-password`  
**Method:** `POST`  
**Auth Required:** No

**Request Body:**
```json
{
    "phoneNumber": "+998901234567"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Yangi parol yuborildi",
    "note": "Haqiqiy loyihada SMS orqali yuboriladi"
}
```

### 6. Get User Profile
Get current user profile information.

**URL:** `/user-mobile/profile`  
**Method:** `GET`  
**Auth Required:** Yes

**Headers:**
```
Authorization: Bearer <your_token>
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "user": {
        "id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+998901234567",
        "isVerified": true,
        "image": "profile_image_url",
        "lastLogin": "2024-02-20T10:00:00.000Z",
        "createdAt": "2024-02-20T10:00:00.000Z",
        "updatedAt": "2024-02-20T10:00:00.000Z"
    }
}
```

### 7. Update User Profile
Update user profile information.

**URL:** `/user-mobile/profile`  
**Method:** `PUT`  
**Auth Required:** Yes

**Headers:**
```
Authorization: Bearer <your_token>
```

**Request Body:**
```json
{
    "firstName": "John Updated",
    "lastName": "Doe Updated",
    "image": "new_profile_image_url"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Profil muvaffaqiyatli yangilandi",
    "user": {
        "id": "user_id",
        "firstName": "John Updated",
        "lastName": "Doe Updated",
        "phoneNumber": "+998901234567",
        "isVerified": true,
        "image": "new_profile_image_url",
        "lastLogin": "2024-02-20T10:00:00.000Z",
        "createdAt": "2024-02-20T10:00:00.000Z",
        "updatedAt": "2024-02-20T10:00:00.000Z"
    }
}
```

### 8. Change Password
Change user password.

**URL:** `/user-mobile/change-password`  
**Method:** `PUT`  
**Auth Required:** Yes

**Headers:**
```
Authorization: Bearer <your_token>
```

**Request Body:**
```json
{
    "currentPassword": "old_password",
    "newPassword": "new_password"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Parol muvaffaqiyatli o'zgartirildi"
}
```

## Error Responses

### 400 Bad Request
```json
{
    "success": false,
    "message": "Barcha maydonlar to'ldirilishi shart"
}
```

### 401 Unauthorized
```json
{
    "success": false,
    "message": "Telefon raqam yoki parol noto'g'ri"
}
```

### 403 Forbidden
```json
{
    "success": false,
    "message": "Sizning akkauntingiz hali tasdiqlanmagan"
}
```

### 404 Not Found
```json
{
    "success": false,
    "message": "Foydalanuvchi topilmadi"
}
```

### 500 Internal Server Error
```json
{
    "success": false,
    "message": "Serverda xatolik yuz berdi"
}
```

## Validation Rules

### Phone Number
- Format: `+998901234567`
- Must start with `+998`
- Must be exactly 13 characters
- Must contain only digits after `+998`

### Password
- Minimum length: 6 characters
- Required for registration and login

### Names
- First name and last name: minimum 2 characters
- Required for registration

### Verification Code
- 6-digit numeric code
- Expires after 10 minutes
- Required for phone verification

## Product Endpoints

### 1. Get All Products
Get all active products with filtering and pagination.

**URL:** `/user-mobile/products`  
**Method:** `GET`  
**Auth Required:** No

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Category ID filter
- `subcategory` (optional): Subcategory ID filter
- `search` (optional): Search by product name
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order - asc/desc (default: desc)

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "data": {
        "products": [
            {
                "id": "product_id",
                "name": "Product Name",
                "price": 1000,
                "originalPrice": 1200,
                "discount": 17,
                "category": {
                    "id": "category_id",
                    "name": "Category Name"
                },
                "subcategory": {
                    "id": "subcategory_id",
                    "name": "Subcategory Name"
                },
                "quantity": 50,
                "inStock": true,
                "createdAt": "2024-02-20T10:00:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalItems": 100,
            "itemsPerPage": 20,
            "hasNextPage": true,
            "hasPrevPage": false
        }
    }
}
```

### 2. Get Product by ID
Get a specific product by its ID.

**URL:** `/user-mobile/products/:id`  
**Method:** `GET`  
**Auth Required:** No

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "data": {
        "id": "product_id",
        "name": "Product Name",
        "price": 1000,
        "originalPrice": 1200,
        "discount": 17,
        "category": {
            "id": "category_id",
            "name": "Category Name"
        },
        "subcategory": {
            "id": "subcategory_id",
            "name": "Subcategory Name"
        },
        "quantity": 50,
        "inStock": true,
        "createdAt": "2024-02-20T10:00:00.000Z"
    }
}
```

### 3. Get Products by Category
Get products filtered by category or subcategory.

**URL:** `/user-mobile/products/category/:categoryId`  
**Method:** `GET`  
**Auth Required:** No

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order - asc/desc (default: desc)

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "data": {
        "category": {
            "id": "category_id",
            "name": "Category Name"
        },
        "products": [...],
        "pagination": {...}
    }
}
```

### 4. Search Products
Search products by name.

**URL:** `/user-mobile/products/search`  
**Method:** `GET`  
**Auth Required:** No

**Query Parameters:**
- `q` (required): Search query (minimum 2 characters)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order - asc/desc (default: desc)

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "data": {
        "searchQuery": "search term",
        "products": [...],
        "pagination": {...}
    }
}
```

### 5. Get Discounted Products
Get all products that have discounts.

**URL:** `/user-mobile/products/discounted`  
**Method:** `GET`  
**Auth Required:** No

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (default: discount)
- `sortOrder` (optional): Sort order - asc/desc (default: desc)

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "data": {
        "products": [...],
        "pagination": {...}
    }
}
```

### 6. Get New Products
Get recently added products.

**URL:** `/user-mobile/products/new`  
**Method:** `GET`  
**Auth Required:** No

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `days` (optional): Number of days to look back (default: 30)

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "data": {
        "products": [...],
        "pagination": {...}
    }
}
```

## Notes

1. **JWT Token**: All protected endpoints require a valid JWT token in the Authorization header
2. **Auto Verification**: Users are automatically verified after registration (no phone verification required)
3. **Password Security**: Passwords are hashed using bcrypt before storage
4. **Token Expiration**: JWT tokens expire after 30 days
5. **SMS Integration**: In production, SMS services should be integrated for password reset
6. **Product Endpoints**: All product endpoints are public and don't require authentication
7. **Product Status**: Only active products are returned to users
8. **Pagination**: All product list endpoints support pagination
9. **Discount Calculation**: Discount percentage is automatically calculated based on original and current price 