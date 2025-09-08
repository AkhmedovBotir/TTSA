# Shop Owner Mobile - Seller (Sotuvchi) API Documentation

## Base URL
```
http://10.214.200.21:3000/api/shop-owner-mobile
```

## Authentication
Barcha endpointlar Shop Owner autentifikatsiyasini talab qiladi. `Authorization` header da JWT token yuborish kerak:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Sotuvchi Qo'shish

**Endpoint:** `POST /api/shop-owner-mobile/seller/create`

**Description:** Yangi sotuvchi qo'shish (faqat Shop Owner uchun)

**Request Body:**
```json
{
    "fullName": "Sotuvchi To'liq Ismi",
    "username": "sotuvchi_username",
    "password": "parol123",
    "phone": "+998901234567"
}
```

**Validation Rules:**
- `fullName`: Majburiy, string
- `username`: Majburiy, kamida 3 ta belgi, unique
- `password`: Majburiy, kamida 6 ta belgi
- `phone`: Majburiy, Format: +998901234567, unique

**Success Response (201):**
```json
{
    "success": true,
    "message": "Sotuvchi muvaffaqiyatli qo'shildi",
    "seller": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "fullName": "Sotuvchi To'liq Ismi",
        "username": "sotuvchi_username",
        "phone": "+998901234567",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z"
    }
}
```

**Error Responses:**
- `400`: Validatsiya xatoliklari
- `401`: Avtorizatsiya talab qilinadi
- `500`: Server xatoligi

---

## 2. Sotuvchilar Ro'yxatini Olish

**Endpoint:** `GET /api/shop-owner-mobile/seller/list`

**Description:** Shop Owner ning do'konidagi barcha sotuvchilar ro'yxatini olish

**Query Parameters:**
- `status` (optional): Status bo'yicha filtrlash (`active`/`inactive`)
- `search` (optional): Qidiruv (ism, username, telefon)

**Example Request:**
```
GET /api/shop-owner-mobile/seller/list?status=active&search=sotuvchi
```

**Success Response (200):**
```json
{
    "success": true,
    "count": 2,
    "sellers": [
        {
            "id": "64f1a2b3c4d5e6f7a8b9c0d1",
            "fullName": "Sotuvchi To'liq Ismi",
            "username": "sotuvchi_username",
            "phone": "+998901234567",
            "status": "active",
            "createdAt": "2024-01-15T10:30:00.000Z"
        }
    ]
}
```

**Error Responses:**
- `401`: Avtorizatsiya talab qilinadi
- `500`: Server xatoligi

---

## 3. Sotuvchi Ma'lumotlarini Olish

**Endpoint:** `GET /api/shop-owner-mobile/seller/:sellerId`

**Description:** Bitta sotuvchi ma'lumotlarini olish

**Path Parameters:**
- `sellerId`: Sotuvchi ID

**Example Request:**
```
GET /api/shop-owner-mobile/seller/64f1a2b3c4d5e6f7a8b9c0d1
```

**Success Response (200):**
```json
{
    "success": true,
    "seller": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "fullName": "Sotuvchi To'liq Ismi",
        "username": "sotuvchi_username",
        "phone": "+998901234567",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z"
    }
}
```

**Error Responses:**
- `400`: Noto'g'ri ID formati
- `401`: Avtorizatsiya talab qilinadi
- `404`: Sotuvchi topilmadi
- `500`: Server xatoligi

---

## 4. Sotuvchi Statusini O'zgartirish

**Endpoint:** `PATCH /api/shop-owner-mobile/seller/:sellerId/status`

**Description:** Sotuvchi statusini o'zgartirish

**Path Parameters:**
- `sellerId`: Sotuvchi ID

**Request Body:**
```json
{
    "status": "inactive"
}
```

**Status Values:**
- `active`: Faol
- `inactive`: Faol emas

**Success Response (200):**
```json
{
    "success": true,
    "message": "Sotuvchi statusi muvaffaqiyatli o'zgartirildi",
    "seller": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "fullName": "Sotuvchi To'liq Ismi",
        "username": "sotuvchi_username",
        "phone": "+998901234567",
        "status": "inactive",
        "createdAt": "2024-01-15T10:30:00.000Z"
    }
}
```

**Error Responses:**
- `400`: Noto'g'ri status yoki ID formati
- `401`: Avtorizatsiya talab qilinadi
- `404`: Sotuvchi topilmadi
- `500`: Server xatoligi

---

## 5. Sotuvchini Tahrirlash

**Endpoint:** `PUT /api/shop-owner-mobile/seller/:sellerId`

**Description:** Sotuvchi ma'lumotlarini tahrirlash

**Path Parameters:**
- `sellerId`: Sotuvchi ID

**Request Body:**
```json
{
    "fullName": "Yangi To'liq Ism",
    "phone": "+998901234568"
}
```

**Validation Rules:**
- `fullName`: Ixtiyoriy, kamida 2 ta belgi
- `phone`: Ixtiyoriy, Format: +998901234567, unique

**Success Response (200):**
```json
{
    "success": true,
    "message": "Sotuvchi muvaffaqiyatli tahrirlandi",
    "seller": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "fullName": "Yangi To'liq Ism",
        "username": "sotuvchi_username",
        "phone": "+998901234568",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00.000Z"
    }
}
```

**Error Responses:**
- `400`: Validatsiya xatoliklari
- `401`: Avtorizatsiya talab qilinadi
- `404`: Sotuvchi topilmadi
- `500`: Server xatoligi

---

## 6. Sotuvchi Parolini O'zgartirish

**Endpoint:** `PATCH /api/shop-owner-mobile/seller/:sellerId/password`

**Description:** Sotuvchi parolini o'zgartirish

**Path Parameters:**
- `sellerId`: Sotuvchi ID

**Request Body:**
```json
{
    "password": "yangi_parol123"
}
```

**Validation Rules:**
- `password`: Majburiy, kamida 6 ta belgi

**Success Response (200):**
```json
{
    "success": true,
    "message": "Sotuvchi paroli muvaffaqiyatli o'zgartirildi"
}
```

**Error Responses:**
- `400`: Parol kamida 6 ta belgi bo'lishi kerak
- `401`: Avtorizatsiya talab qilinadi
- `404`: Sotuvchi topilmadi
- `500`: Server xatoligi

---

## 7. Sotuvchini O'chirish

**Endpoint:** `DELETE /api/shop-owner-mobile/seller/:sellerId`

**Description:** Sotuvchini o'chirish

**Path Parameters:**
- `sellerId`: Sotuvchi ID

**Success Response (200):**
```json
{
    "success": true,
    "message": "Sotuvchi muvaffaqiyatli o'chirildi"
}
```

**Error Responses:**
- `400`: Noto'g'ri ID formati
- `401`: Avtorizatsiya talab qilinadi
- `404`: Sotuvchi topilmadi
- `500`: Server xatoligi

---

## Permissions

- **Shop Owner:** Faqat o'z do'konidagi sotuvchilarni boshqarish huquqi
- **Do'kon Bog'lanishi:** Har bir sotuvchi Shop Owner ning do'koniga avtomatik bog'lanadi

---

## Notes

1. **Do'kon Bog'lanishi**: Har bir sotuvchi Shop Owner ning do'koniga avtomatik bog'lanadi
2. **Status Boshqaruvi**: Sotuvchilar `active`/`inactive` statuslarga ega
3. **Unique Fields**: `username` va `phone` maydonlari unique
4. **Password Security**: Parollar bcrypt bilan hashlanadi
5. **Shop Owner Tracking**: Har bir sotuvchi qaysi Shop Owner tomonidan yaratilgani kuzatiladi
6. **Validation**: Barcha kirish ma'lumotlari qat'iy validatsiya qilinadi
7. **Error Handling**: Barcha xatoliklar tuzilgan formatda qaytariladi
8. **Mobile Optimized**: Barcha endpointlar mobil ilovalar uchun optimallashtirilgan 