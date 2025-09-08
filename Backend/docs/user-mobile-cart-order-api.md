# User Mobile - Savatcha va Buyurtma API Dokumentatsiyasi

## Umumiy ma'lumot

Bu dokumentatsiya foydalanuvchi mobil ilovasi uchun savatcha va buyurtma boshqarish API'larini tavsiflaydi. Barcha API'lar autentifikatsiya talab qiladi va JWT token orqali foydalanuvchi identifikatsiyasi amalga oshiriladi.

**Base URL:** `/api/user-mobile`

---

## 🛒 Savatcha (Cart) API'lari

### 1. Savatchani olish

**Endpoint:** `GET /cart`

**Tavsif:** Foydalanuvchining savatchasini olish va mahsulot ma'lumotlarini yangilash

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Javob:**
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
            "name": "Mahsulot nomi",
            "price": 15000,
            "originalPrice": 20000,
            "image": "image_url",
            "category": {
              "id": "category_id",
              "name": "Kategoriya nomi"
            },
            "subcategory": {
              "id": "subcategory_id",
              "name": "Subkategoriya nomi"
            },
            "unit": "dona",
            "unitSize": 1,
            "shop": {
              "id": "shop_id",
              "name": "Do'kon nomi",
              "title": "Do'kon sarlavhasi",
              "address": "Do'kon manzili",
              "phone": "Do'kon telefoni"
            },
            "inStock": true,
            "availableQuantity": 50
          },
          "quantity": 2,
          "price": 15000,
          "originalPrice": 20000,
          "discount": 25,
          "totalPrice": 30000,
          "totalOriginalPrice": 40000,
          "addedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "totalPrice": 30000,
      "totalOriginalPrice": 40000,
      "totalDiscount": 10000,
      "itemCount": 2,
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Xatolik kodlari:**
- `401` - Autentifikatsiya talab qilinadi
- `500` - Serverda xatolik

---

### 2. Mahsulotni savatchaga qo'shish

**Endpoint:** `POST /cart/add`

**Tavsif:** Savatchaga yangi mahsulot qo'shish yoki mavjud mahsulot miqdorini oshirish

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "productId": "product_id",
  "quantity": 1
}
```

**Parametrlar:**
- `productId` (required) - Mahsulot ID
- `quantity` (optional) - Miqdor (default: 1)

**Javob:**
```json
{
  "success": true,
  "message": "Mahsulot savatchaga qo'shildi",
  "data": {
    "cartId": "cart_id",
    "itemCount": 3,
    "totalPrice": 45000
  }
}
```

**Xatolik kodlari:**
- `400` - Noto'g'ri ma'lumotlar
- `401` - Autentifikatsiya talab qilinadi
- `404` - Mahsulot topilmadi
- `500` - Serverda xatolik

---

### 3. Savatchadagi mahsulot miqdorini yangilash

**Endpoint:** `PUT /cart/items/:itemId/quantity`

**Tavsif:** Savatchadagi mahsulot miqdorini o'zgartirish

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "quantity": 5
}
```

**Parametrlar:**
- `itemId` (path) - Savatcha element ID
- `quantity` (body) - Yangi miqdor (min: 1)

**Javob:**
```json
{
  "success": true,
  "message": "Miqdor yangilandi",
  "data": {
    "itemId": "item_id",
    "quantity": 5,
    "totalPrice": 75000
  }
}
```

**Xatolik kodlari:**
- `400` - Noto'g'ri miqdor yoki yetarli miqdor yo'q
- `401` - Autentifikatsiya talab qilinadi
- `404` - Savatcha yoki element topilmadi
- `500` - Serverda xatolik

---

### 4. Savatchadan mahsulotni o'chirish

**Endpoint:** `DELETE /cart/items/:itemId`

**Tavsif:** Savatchadan bitta mahsulotni o'chirish

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parametrlar:**
- `itemId` (path) - Savatcha element ID

**Javob:**
```json
{
  "success": true,
  "message": "Mahsulot savatchadan o'chirildi",
  "data": {
    "itemCount": 1,
    "totalPrice": 15000
  }
}
```

**Xatolik kodlari:**
- `401` - Autentifikatsiya talab qilinadi
- `404` - Savatcha yoki element topilmadi
- `500` - Serverda xatolik

---

### 5. Savatchani tozalash

**Endpoint:** `DELETE /cart/clear`

**Tavsif:** Savatchadagi barcha mahsulotlarni o'chirish

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Javob:**
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

**Xatolik kodlari:**
- `401` - Autentifikatsiya talab qilinadi
- `404` - Savatcha topilmadi
- `500` - Serverda xatolik

---

## 📦 Buyurtma (Order) API'lari

### 1. Buyurtma yaratish

**Endpoint:** `POST /orders`

**Tavsif:** Savatchadagi mahsulotlardan buyurtma yaratish

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "deliveryAddress": {
    "fullName": "To'liq ism",
    "phone": "+998901234567",
    "address": "Yetkazib berish manzili",
    "city": "Shahar nomi",
    "postalCode": "12345"
  },
  "deliveryNotes": "Izohlar",
  "paymentMethod": "cash",
  "estimatedDelivery": "2024-01-20"
}
```

**Parametrlar:**
- `deliveryAddress` (required) - Yetkazib berish ma'lumotlari
  - `fullName` (required) - To'liq ism
  - `phone` (required) - Telefon raqam
  - `address` (required) - Manzil
  - `city` (optional) - Shahar
  - `postalCode` (optional) - Pochta indeksi
- `deliveryNotes` (optional) - Yetkazib berish bo'yicha izohlar
- `paymentMethod` (optional) - To'lov usuli: `cash`, `card`, `online` (default: `cash`)
- `estimatedDelivery` (optional) - Taxminiy yetkazib berish sanasi

**Javob:**
```json
{
  "success": true,
  "message": "Buyurtma muvaffaqiyatli yaratildi",
  "data": {
    "order": {
      "id": "order_id",
      "orderNumber": "ORD240115001",
      "status": "pending",
      "paymentStatus": "pending",
      "totalPrice": 45000,
      "totalDiscount": 10000,
      "itemCount": 3,
      "deliveryAddress": {
        "fullName": "To'liq ism",
        "phone": "+998901234567",
        "address": "Yetkazib berish manzili",
        "city": "Shahar nomi",
        "postalCode": "12345"
      },
      "deliveryNotes": "Izohlar",
      "estimatedDelivery": "2024-01-20T00:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Xatolik kodlari:**
- `400` - Savatcha bo'sh yoki yetkazib berish ma'lumotlari to'liq emas
- `401` - Autentifikatsiya talab qilinadi
- `500` - Serverda xatolik

---

### 2. Buyurtmalar ro'yxatini olish

**Endpoint:** `GET /orders`

**Tavsif:** Foydalanuvchining barcha buyurtmalarini olish

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query parametrlari:**
- `page` (optional) - Sahifa raqami (default: 1)
- `limit` (optional) - Sahifadagi elementlar soni (default: 10)
- `status` (optional) - Buyurtma holati filtri
- `paymentStatus` (optional) - To'lov holati filtri

**Javob:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_id",
        "orderNumber": "ORD240115001",
        "items": [
          {
            "id": "item_id",
            "product": {
              "id": "product_id",
              "name": "Mahsulot nomi",
              "image": "image_url",
              "category": {
                "id": "category_id",
                "name": "Kategoriya nomi"
              },
              "subcategory": {
                "id": "subcategory_id",
                "name": "Subkategoriya nomi"
              },
              "unit": "dona",
              "unitSize": 1,
              "shop": {
                "id": "shop_id",
                "name": "Do'kon nomi",
                "title": "Do'kon sarlavhasi"
              }
            },
            "quantity": 2,
            "price": 15000,
            "originalPrice": 20000,
            "discount": 25,
            "totalPrice": 30000
          }
        ],
        "totalPrice": 30000,
        "totalOriginalPrice": 40000,
        "totalDiscount": 10000,
        "itemCount": 2,
        "status": "pending",
        "paymentStatus": "pending",
        "paymentMethod": "cash",
        "deliveryAddress": {
          "fullName": "To'liq ism",
          "phone": "+998901234567",
          "address": "Yetkazib berish manzili",
          "city": "Shahar nomi",
          "postalCode": "12345"
        },
        "deliveryNotes": "Izohlar",
        "estimatedDelivery": "2024-01-20T00:00:00.000Z",
        "actualDelivery": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

**Xatolik kodlari:**
- `401` - Autentifikatsiya talab qilinadi
- `500` - Serverda xatolik

---

### 3. Bitta buyurtmani olish

**Endpoint:** `GET /orders/:orderId`

**Tavsif:** Bitta buyurtmaning batafsil ma'lumotlarini olish

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parametrlar:**
- `orderId` (path) - Buyurtma ID

**Javob:** Yuqoridagi buyurtma ma'lumotlari bilan bir xil

**Xatolik kodlari:**
- `400` - Noto'g'ri buyurtma ID
- `401` - Autentifikatsiya talab qilinadi
- `404` - Buyurtma topilmadi
- `500` - Serverda xatolik

---

### 4. Buyurtmani bekor qilish

**Endpoint:** `PUT /orders/:orderId/cancel`

**Tavsif:** Faqat "pending" holatdagi buyurtmani bekor qilish

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Parametrlar:**
- `orderId` (path) - Buyurtma ID

**Javob:**
```json
{
  "success": true,
  "message": "Buyurtma bekor qilindi",
  "data": {
    "orderId": "order_id",
    "status": "cancelled"
  }
}
```

**Xatolik kodlari:**
- `400` - Buyurtmani bekor qilish mumkin emas
- `401` - Autentifikatsiya talab qilinadi
- `404` - Buyurtma topilmadi
- `500` - Serverda xatolik

---

### 5. Buyurtma statistikasi

**Endpoint:** `GET /orders/stats`

**Tavsif:** Foydalanuvchining buyurtma statistikasini olish

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Javob:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 5,
    "totalSpent": 150000,
    "pendingOrders": 1,
    "processingOrders": 2,
    "deliveredOrders": 1,
    "cancelledOrders": 1
  }
}
```

**Xatolik kodlari:**
- `401` - Autentifikatsiya talab qilinadi
- `500` - Serverda xatolik

---

## 📊 Buyurtma holatlari

### Buyurtma holati (status):
- `pending` - Kutilmoqda
- `confirmed` - Tasdiqlangan
- `processing` - Tayyorlanmoqda
- `shipped` - Yuborilgan
- `delivered` - Yetkazib berilgan
- `cancelled` - Bekor qilingan

### To'lov holati (paymentStatus):
- `pending` - Kutilmoqda
- `paid` - To'langan
- `failed` - Xatolik
- `refunded` - Qaytarilgan

### To'lov usuli (paymentMethod):
- `cash` - Naqd pul
- `card` - Plastik karta
- `online` - Onlayn to'lov

---

## 🔐 Autentifikatsiya

Barcha API'lar JWT token talab qiladi. Token `Authorization` headerida quyidagi formatda yuborilishi kerak:

```
Authorization: Bearer <JWT_TOKEN>
```

Token foydalanuvchi ro'yxatdan o'tish yoki tizimga kirish orqali olinadi.

---

## ❌ Xatolik kodlari

- `400` - Noto'g'ri so'rov (Bad Request)
- `401` - Autentifikatsiya talab qilinadi (Unauthorized)
- `403` - Ruxsat berilmagan (Forbidden)
- `404` - Topilmadi (Not Found)
- `500` - Serverda xatolik (Internal Server Error)

---

## 📝 Misollar

### Savatchaga mahsulot qo'shish:
```bash
curl -X POST http://localhost:3000/api/user-mobile/cart/add \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product_id_here",
    "quantity": 2
  }'
```

### Buyurtma yaratish:
```bash
curl -X POST http://localhost:3000/api/user-mobile/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryAddress": {
      "fullName": "Aziz Azizov",
      "phone": "+998901234567",
      "address": "Toshkent sh., Chilonzor t., 1-uy",
      "city": "Toshkent",
      "postalCode": "100000"
    },
    "deliveryNotes": "Uy oldida qoldiring",
    "paymentMethod": "cash"
  }'
```

---

## 🔧 Texnik ma'lumotlar

- **Database:** MongoDB
- **ORM:** Mongoose
- **Authentication:** JWT
- **Response Format:** JSON
- **Error Handling:** Standard HTTP status codes
- **Validation:** Mongoose schema validation + custom validation
- **Pagination:** Page-based with limit parameter


