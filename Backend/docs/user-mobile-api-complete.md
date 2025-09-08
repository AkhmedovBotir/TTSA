# User Mobile API - To'liq Dokumentatsiya

## Umumiy ma'lumot

**Base URL:** `/api/user-mobile`

Bu API foydalanuvchilar uchun mobil ilovada ishlatiladigan barcha endpointlarni o'z ichiga oladi.

---

## Autentifikatsiya

### JWT Token
- **Format:** `Bearer {token}`
- **Header:** `Authorization: Bearer {token}`
- **Muddati:** 7 kun

---

## 1. Foydalanuvchi Autentifikatsiyasi

### 1.1 Foydalanuvchi ro'yxatdan o'tkazish
```http
POST /api/user-mobile/register
```

**Request Body:**
```json
{
  "firstName": "string (majburiy)",
  "lastName": "string (majburiy)",
  "phoneNumber": "string (majburiy, format: +998901234567)",
  "password": "string (majburiy, min: 6 belgi)",
  "username": "string (ixtiyoriy)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi va tizimga kirildi",
  "token": "JWT_TOKEN",
  "user": {
    "id": "user_id",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "phoneNumber": "string",
    "username": "string",
    "isVerified": true,
    "isLoggedIn": true
  },
  "authStatus": {
    "isAuthenticated": true,
    "userType": "user"
  }
}
```

### 1.2 Foydalanuvchi kirishi
```http
POST /api/user-mobile/login
```

**Request Body:**
```json
{
  "phoneNumber": "string (majburiy)",
  "password": "string (majburiy)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli kirildi",
  "token": "JWT_TOKEN",
  "user": {
    "id": "user_id",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "phoneNumber": "string",
    "username": "string",
    "isVerified": true,
    "isLoggedIn": true
  },
  "authStatus": {
    "isAuthenticated": true,
    "userType": "user"
  }
}
```

### 1.3 Foydalanuvchi chiqishi
```http
POST /api/user-mobile/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Muvaffaqiyatli chiqildi",
  "authStatus": {
    "isAuthenticated": false,
    "userType": null
  }
}
```

### 1.4 Parolni unutib qo'ygan holda tiklash
```http
POST /api/user-mobile/forgot-password
```

**Request Body:**
```json
{
  "phoneNumber": "string (majburiy)",
  "newPassword": "string (majburiy, min: 6 belgi)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli tiklandi"
}
```

---

## 2. Foydalanuvchi Profili (Autentifikatsiya talab qilinadi)

### 2.1 Profil ma'lumotlarini olish
```http
GET /api/user-mobile/profile
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "phoneNumber": "string",
    "username": "string",
    "image": "string",
    "isVerified": true,
    "isLoggedIn": true
  },
  "authStatus": {
    "isAuthenticated": true,
    "userType": "user"
  }
}
```

### 2.2 Profil ma'lumotlarini yangilash
```http
PUT /api/user-mobile/profile
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "firstName": "string (ixtiyoriy)",
  "lastName": "string (ixtiyoriy)",
  "username": "string (ixtiyoriy)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profil muvaffaqiyatli yangilandi",
  "user": {
    "id": "user_id",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "phoneNumber": "string",
    "username": "string",
    "image": "string",
    "isVerified": true
  }
}
```

### 2.3 Parolni o'zgartirish
```http
PUT /api/user-mobile/change-password
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "newPassword": "string (majburiy, min: 6 belgi)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Parol muvaffaqiyatli o'zgartirildi"
}
```

---

## 3. Mahsulotlar (Public - Autentifikatsiya talab qilinmaydi)

### 3.1 Barcha mahsulotlarni olish
```http
GET /api/user-mobile/products?page=1&limit=20&category={categoryId}&subcategory={subcategoryId}&search={searchTerm}&searchType={product/shop}&minPrice={minPrice}&maxPrice={maxPrice}&sortBy={sortBy}&sortOrder={sortOrder}&inStock={true/false}&hasDiscount={true/false}&minDiscount={minDiscount}&maxDiscount={maxDiscount}
```

**Query Parameters:**
- `page` (default: 1) - Sahifa raqami
- `limit` (default: 20) - Sahifadagi elementlar soni
- `category` - Kategoriya ID
- `subcategory` - Subkategoriya ID
- `search` - Qidiruv so'zi
- `searchType` (default: 'product') - Qidiruv turi ('product' yoki 'shop')
- `minPrice` - Minimal narx
- `maxPrice` - Maksimal narx
- `sortBy` (default: 'createdAt') - Tartiblash maydoni
- `sortOrder` (default: 'desc') - Tartiblash tartibi ('asc' yoki 'desc')
- `inStock` - Omborda bor/yo'q ('true' yoki 'false')
- `hasDiscount` - Chegirmasi bor/yo'q ('true' yoki 'false')
- `minDiscount` - Minimal chegirma foizi
- `maxDiscount` - Maksimal chegirma foizi

**Qidiruv turlari:**
- `searchType=product` - Mahsulot nomi bo'yicha qidirish (default)
- `searchType=shop` - Do'kon nomi bo'yicha qidirish

**Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_id",
        "name": "string",
        "price": "number",
        "originalPrice": "number",
        "discount": "number (foiz)",
        "category": {
          "id": "category_id",
          "name": "string"
        },
        "subcategory": {
          "id": "subcategory_id",
          "name": "string"
        },
        "quantity": "number",
        "unit": "string",
        "unitSize": "string",
        "shop": {
          "id": "shop_id",
          "name": "string",
          "title": "string",
          "address": "string",
          "phone": "string",
          "status": "string"
        },
        "inStock": "boolean",
        "status": "string",
        "image": "string",
        "createdAt": "date"
      }
    ],
    "pagination": {
      "currentPage": "number",
      "totalPages": "number",
      "totalItems": "number",
      "itemsPerPage": "number",
      "hasNextPage": "boolean",
      "hasPrevPage": "boolean"
    }
  }
}
```

### 3.2 Bitta mahsulotni ID bo'yicha olish
```http
GET /api/user-mobile/products/{id}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "product_id",
    "name": "string",
    "price": "number",
    "originalPrice": "number",
    "discount": "number",
    "category": {
      "id": "category_id",
      "name": "string"
    },
    "subcategory": {
      "id": "subcategory_id",
      "name": "string"
    },
    "quantity": "number",
    "unit": "string",
    "unitSize": "string",
    "inStock": "boolean",
    "status": "string",
    "image": "string",
    "shop": {
      "id": "shop_id",
      "name": "string",
      "title": "string",
      "address": "string",
      "phone": "string",
      "status": "string"
    },
    "createdAt": "date"
  }
}
```

### 3.3 Kategoriya bo'yicha mahsulotlarni olish
```http
GET /api/user-mobile/products/category/{categoryId}?page=1&limit=20&sortBy={sortBy}&sortOrder={sortOrder}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "category": {
      "id": "category_id",
      "name": "string"
    },
    "products": [...],
    "pagination": {...}
  }
}
```

### 3.4 Mahsulotlarni qidirish
```http
GET /api/user-mobile/products/search?q={searchTerm}&searchType={product/shop}&page=1&limit=20&sortBy={sortBy}&sortOrder={sortOrder}
```

**Query Parameters:**
- `q` (majburiy, min: 2 belgi) - Qidiruv so'zi
- `searchType` (default: 'product') - Qidiruv turi ('product' yoki 'shop')

**Qidiruv turlari:**
- `searchType=product` - Mahsulot nomi bo'yicha qidirish (default)
- `searchType=shop` - Do'kon nomi bo'yicha qidirish

**Response (200):**
```json
{
  "success": true,
  "data": {
    "searchQuery": "string",
    "searchType": "string",
    "products": [...],
    "pagination": {...}
  }
}
```

### 3.5 Chegirmali mahsulotlarni olish
```http
GET /api/user-mobile/products/discounted?page=1&limit=20&sortBy={sortBy}&sortOrder={sortOrder}
```

### 3.6 Yangi mahsulotlarni olish
```http
GET /api/user-mobile/products/new?page=1&limit=20&days=30
```

**Query Parameters:**
- `days` (default: 30) - Oxirgi necha kundagi mahsulotlar

---

## 4. Savatcha (Autentifikatsiya talab qilinadi)

### 4.1 Savatchani olish
```http
GET /api/user-mobile/cart
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": "cart_id",
      "items": [
        {
          "id": "item_id",
          "product": {
            "id": "product_id",
            "name": "string",
            "price": "number",
            "originalPrice": "number",
            "image": "string",
            "category": {...},
            "subcategory": {...},
            "unit": "string",
            "unitSize": "string",
            "shop": {...},
            "inStock": "boolean",
            "availableQuantity": "number"
          },
          "quantity": "number",
          "price": "number",
          "originalPrice": "number",
          "discount": "number",
          "totalPrice": "number",
          "totalOriginalPrice": "number",
          "addedAt": "date"
        }
      ],
      "totalPrice": "number",
      "totalOriginalPrice": "number",
      "totalDiscount": "number",
      "itemCount": "number",
      "updatedAt": "date"
    }
  }
}
```

### 4.2 Mahsulotni savatchaga qo'shish
```http
POST /api/user-mobile/cart/add
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "productId": "string (majburiy)",
  "quantity": "number (default: 1, min: 1)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Mahsulot savatchaga qo'shildi",
  "data": {
    "cartId": "cart_id",
    "itemCount": "number",
    "totalPrice": "number"
  }
}
```

### 4.3 Savatchadagi mahsulot miqdorini yangilash
```http
PUT /api/user-mobile/cart/items/{itemId}/quantity
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "quantity": "number (majburiy, min: 1)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Miqdor yangilandi",
  "data": {
    "itemId": "item_id",
    "quantity": "number",
    "totalPrice": "number"
  }
}
```

### 4.4 Savatchadan mahsulotni o'chirish
```http
DELETE /api/user-mobile/cart/items/{itemId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Mahsulot savatchadan o'chirildi",
  "data": {
    "itemCount": "number",
    "totalPrice": "number"
  }
}
```

### 4.5 Savatchani tozalash
```http
DELETE /api/user-mobile/cart/clear
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Savatcha tozalandi",
  "data": {
    "itemCount": 0,
    "totalPrice": 0
  }
}
```

---

## 5. Buyurtmalar (Autentifikatsiya talab qilinadi)

### 5.1 Buyurtma yaratish
```http
POST /api/user-mobile/orders
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "deliveryAddress": {
    "fullName": "string (majburiy)",
    "phone": "string (majburiy)",
    "address": "string (majburiy)"
  },
  "deliveryNotes": "string (ixtiyoriy)",
  "paymentMethod": "string (default: 'cash')",
  "estimatedDelivery": "date (ixtiyoriy)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli yaratildi",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "string",
      "status": "string",
      "paymentStatus": "string",
      "totalPrice": "number",
      "totalDiscount": "number",
      "itemCount": "number",
      "deliveryAddress": {...},
      "deliveryNotes": "string",
      "estimatedDelivery": "date",
      "createdAt": "date"
    }
  }
}
```

### 5.2 Barcha buyurtmalarni olish
```http
GET /api/user-mobile/orders?page=1&limit=10&status={status}&paymentStatus={paymentStatus}
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (default: 1) - Sahifa raqami
- `limit` (default: 10) - Sahifadagi elementlar soni
- `status` - Buyurtma holati
- `paymentStatus` - To'lov holati

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_id",
        "orderNumber": "string",
        "items": [...],
        "totalPrice": "number",
        "totalOriginalPrice": "number",
        "totalDiscount": "number",
        "itemCount": "number",
        "status": "string",
        "paymentStatus": "string",
        "paymentMethod": "string",
        "deliveryAddress": {...},
        "deliveryNotes": "string",
        "estimatedDelivery": "date",
        "actualDelivery": "date",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ],
    "pagination": {...}
  }
}
```

### 5.3 Bitta buyurtmani olish
```http
GET /api/user-mobile/orders/{orderId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "order_id",
    "orderNumber": "string",
    "items": [...],
    "totalPrice": "number",
    "totalOriginalPrice": "number",
    "totalDiscount": "number",
    "itemCount": "number",
    "status": "string",
    "paymentStatus": "string",
    "paymentMethod": "string",
    "deliveryAddress": {...},
    "deliveryNotes": "string",
    "estimatedDelivery": "date",
    "actualDelivery": "date",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### 5.4 Buyurtmani bekor qilish
```http
PUT /api/user-mobile/orders/{orderId}/cancel
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Buyurtma bekor qilindi",
  "data": {
    "orderId": "order_id",
    "status": "string"
  }
}
```

### 5.5 Buyurtma statistikasi
```http
GET /api/user-mobile/orders/stats
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalOrders": "number",
    "totalSpent": "number",
    "pendingOrders": "number",
    "processingOrders": "number",
    "deliveredOrders": "number",
    "cancelledOrders": "number"
  }
}
```

---

## Xatolik kodlari

| Kod | Xabar |
|-----|-------|
| 400 | Noto'g'ri so'rov |
| 401 | Autentifikatsiya talab qilinadi |
| 403 | Ruxsat berilmagan |
| 404 | Topilmadi |
| 500 | Server xatosi |

---

## Namuna so'rovlar

### Mahsulotlarni qidirish
```bash
curl -X GET "http://localhost:3000/api/user-mobile/products?search=olma&page=1&limit=10"
```

### Do'konlar bo'yicha qidirish
```bash
curl -X GET "http://localhost:3000/api/user-mobile/products?search=do'kon_nomi&searchType=shop&page=1&limit=10"
```

### Mahsulotlarni qidirish (search endpoint)
```bash
curl -X GET "http://localhost:3000/api/user-mobile/products/search?q=olma&searchType=product&page=1&limit=10"
```

### Savatchaga mahsulot qo'shish
```bash
curl -X POST "http://localhost:3000/api/user-mobile/cart/add" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "product_id", "quantity": 2}'
```

### Buyurtma yaratish
```bash
curl -X POST "http://localhost:3000/api/user-mobile/orders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryAddress": {
      "fullName": "John Doe",
      "phone": "+998901234567",
      "address": "Toshkent shahri, Chilonzor tumani"
    },
    "deliveryNotes": "Uy oldida kutib turing",
    "paymentMethod": "cash"
  }'
```

---

## Eslatmalar

1. **Autentifikatsiya talab qilinadigan endpointlar** uchun `Authorization: Bearer {token}` headeri majburiy
2. **Public endpointlar** uchun autentifikatsiya talab qilinmaydi
3. **Pagination** barcha ro'yxat endpointlarida mavjud
4. **Error handling** barcha endpointlarda standart formatda
5. **Response format** barcha endpointlarda bir xil strukturaga ega
6. **Qidiruv turlari** - mahsulot nomi yoki do'kon nomi bo'yicha qidirish mumkin
