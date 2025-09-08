# Product (Mahsulot) API Documentation

## Base URL
```
http://localhost:3000/api/product
```

## Authentication
Barcha endpointlar autentifikatsiyani talab qiladi. `Authorization` header da JWT token yuborish kerak:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Mahsulot Yaratish

**Endpoint:** `POST /api/product/create`

**Description:** Yangi mahsulot yaratish (Admin yoki Shop Owner uchun)

**Content-Type:** `multipart/form-data`

**Request Body:**
```
name: "Mahsulot Nomi"
price: 100000
originalPrice: 120000
category: "64f1a2b3c4d5e6f7a8b9c0d1"
subcategory: "64f1a2b3c4d5e6f7a8b9c0d2"
quantity: 50
status: "active"
image: [file] (optional)
```

**Validation Rules:**
- `name`: Majburiy, string
- `price`: Majburiy, number, min: 0
- `originalPrice`: Ixtiyoriy, number, min: 0 (agar berilmagan bo'lsa price ga teng)
- `category`: Majburiy, valid MongoDB ObjectId
- `subcategory`: Majburiy, valid MongoDB ObjectId
- `quantity`: Majburiy, number, min: 0
- `status`: Ixtiyoriy, enum: ['active', 'inactive', 'archived']
- `image`: Ixtiyoriy, rasm fayli (max: 5MB, formatlar: jpg, jpeg, png, gif)

**Success Response (201):**
```json
{
    "success": true,
    "message": "Mahsulot muvaffaqiyatli yaratildi",
    "product": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Mahsulot Nomi",
        "price": 100000,
        "originalPrice": 120000,
        "image": "/uploads/products/product-1234567890-123456789.jpg",
        "category": "64f1a2b3c4d5e6f7a8b9c0d1",
        "subcategory": "64f1a2b3c4d5e6f7a8b9c0d2",
        "quantity": 50,
        "status": "active",
        "createdBy": "64f1a2b3c4d5e6f7a8b9c0d1",
        "createdByModel": "ShopOwner"
    }
}
```

**Error Responses:**
- `400`: Validatsiya xatoliklari
- `401`: Avtorizatsiya talab qilinadi
- `500`: Server xatoligi

---

## 2. Barcha Mahsulotlarni Olish

**Endpoint:** `GET /api/product/list`

**Description:** Barcha mahsulotlar ro'yxatini olish (filtrlash bilan)

**Query Parameters:**
- `status` (optional): Status bo'yicha filtrlash (`active`/`inactive`/`archived`)
- `category` (optional): Kategoriya ID bo'yicha filtrlash
- `subcategory` (optional): Subkategoriya ID bo'yicha filtrlash

**Example Request:**
```
GET /api/product/list?status=active&category=64f1a2b3c4d5e6f7a8b9c0d1
```

**Success Response (200):**
```json
{
    "success": true,
    "count": 2,
    "products": [
        {
            "id": "64f1a2b3c4d5e6f7a8b9c0d1",
            "name": "Mahsulot Nomi",
            "price": 100000,
            "originalPrice": 120000,
            "image": "/uploads/products/product-1234567890-123456789.jpg",
            "category": {
                "id": "64f1a2b3c4d5e6f7a8b9c0d1",
                "name": "Kategoriya Nomi"
            },
            "subcategory": {
                "id": "64f1a2b3c4d5e6f7a8b9c0d2",
                "name": "Subkategoriya Nomi"
            },
            "quantity": 50,
            "status": "active",
            "createdBy": {
                "id": "64f1a2b3c4d5e6f7a8b9c0d1",
                "name": "Shop Owner Nomi"
            },
            "createdByModel": "ShopOwner",
            "createdAt": "2024-01-15T10:30:00.000Z"
        }
    ]
}
```

**Error Responses:**
- `401`: Avtorizatsiya talab qilinadi
- `500`: Server xatoligi

---

## 3. Bitta Mahsulotni Olish

**Endpoint:** `GET /api/product/:id`

**Description:** Bitta mahsulot ma'lumotlarini olish

**Path Parameters:**
- `id`: Mahsulot ID

**Example Request:**
```
GET /api/product/64f1a2b3c4d5e6f7a8b9c0d1
```

**Success Response (200):**
```json
{
    "success": true,
    "product": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Mahsulot Nomi",
        "price": 100000,
        "originalPrice": 120000,
        "image": "/uploads/products/product-1234567890-123456789.jpg",
        "category": {
            "id": "64f1a2b3c4d5e6f7a8b9c0d1",
            "name": "Kategoriya Nomi"
        },
        "subcategory": {
            "id": "64f1a2b3c4d5e6f7a8b9c0d2",
            "name": "Subkategoriya Nomi"
        },
        "quantity": 50,
        "status": "active"
    }
}
```

**Error Responses:**
- `400`: Noto'g'ri ID formati
- `401`: Avtorizatsiya talab qilinadi
- `404`: Mahsulot topilmadi
- `500`: Server xatoligi

---

## 4. Mahsulotni Yangilash

**Endpoint:** `PUT /api/product/:id`

**Description:** Mahsulot ma'lumotlarini yangilash

**Content-Type:** `multipart/form-data`

**Path Parameters:**
- `id`: Mahsulot ID

**Request Body:**
```
name: "Yangi Mahsulot Nomi" (optional)
price: 150000 (optional)
originalPrice: 180000 (optional)
category: "64f1a2b3c4d5e6f7a8b9c0d1" (optional)
subcategory: "64f1a2b3c4d5e6f7a8b9c0d2" (optional)
quantity: 75 (optional)
status: "inactive" (optional)
image: [file] (optional)
```

**Validation Rules:**
- `name`: Ixtiyoriy, string
- `price`: Ixtiyoriy, number, min: 0
- `originalPrice`: Ixtiyoriy, number, min: 0
- `category`: Ixtiyoriy, valid MongoDB ObjectId
- `subcategory`: Ixtiyoriy, valid MongoDB ObjectId
- `quantity`: Ixtiyoriy, number, min: 0
- `status`: Ixtiyoriy, enum: ['active', 'inactive', 'archived']
- `image`: Ixtiyoriy, rasm fayli (max: 5MB, formatlar: jpg, jpeg, png, gif)

**Success Response (200):**
```json
{
    "success": true,
    "message": "Mahsulot muvaffaqiyatli yangilandi",
    "product": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Yangi Mahsulot Nomi",
        "price": 150000,
        "originalPrice": 180000,
        "image": "/uploads/products/product-1234567890-123456789.jpg",
        "category": "64f1a2b3c4d5e6f7a8b9c0d1",
        "subcategory": "64f1a2b3c4d5e6f7a8b9c0d2",
        "quantity": 75,
        "status": "inactive"
    }
}
```

**Error Responses:**
- `400`: Validatsiya xatoliklari
- `401`: Avtorizatsiya talab qilinadi
- `404`: Mahsulot topilmadi
- `500`: Server xatoligi

---

## 5. Mahsulotni O'chirish

**Endpoint:** `DELETE /api/product/:id`

**Description:** Mahsulotni o'chirish

**Path Parameters:**
- `id`: Mahsulot ID

**Success Response (200):**
```json
{
    "success": true,
    "message": "Mahsulot muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**
- `400`: Noto'g'ri ID formati
- `401`: Avtorizatsiya talab qilinadi
- `404`: Mahsulot topilmadi
- `500`: Server xatoligi

---

## Image Upload Xususiyatlari

### Fayl Cheklovlari:
- **Maksimal hajm:** 5MB
- **Ruxsat berilgan formatlar:** jpg, jpeg, png, gif
- **Fayl nomi:** Avtomatik generatsiya qilinadi (product-timestamp-random.ext)

### Fayl Saqlash:
- **Papka:** `uploads/products/`
- **URL:** `/uploads/products/filename.ext`
- **To'liq yo'l:** `http://localhost:3000/uploads/products/filename.ext`

### Rasm Ko'rsatish:
```html
<img src="http://localhost:3000/uploads/products/product-1234567890-123456789.jpg" alt="Mahsulot rasm" />
```

---

## Permissions

- **Admin:** Barcha mahsulotlarni boshqarish huquqi
- **Shop Owner:** O'z do'konidagi mahsulotlarni boshqarish huquqi

---

## Notes

1. **Rasm Yuklash**: Mahsulot yaratish va yangilashda rasm yuklash ixtiyoriy
2. **Fayl Validatsiya**: Faqat rasm fayllari qabul qilinadi
3. **Avtomatik Naming**: Fayl nomlari avtomatik generatsiya qilinadi
4. **Mavjud Rasm**: Yangilashda agar yangi rasm yuklanmasa, mavjud rasm saqlanadi
5. **Kategoriya Validatsiya**: Subkategoriya asosiy kategoriyaga tegishli bo'lishi kerak
6. **Narx Hisoblash**: originalPrice agar berilmagan bo'lsa, price ga teng bo'ladi
7. **Status Boshqaruvi**: Mahsulotlar active/inactive/archived statuslarga ega 