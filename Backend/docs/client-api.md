# Client API Documentation

## Base URL
```
http://localhost:3000/api/client
```

## Authentication
Most endpoints require authentication using JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### 1. Login
Authenticate a client and get access token.

**URL:** `/login`  
**Method:** `POST`  
**Auth Required:** No

**Request Body:**
```json
{
    "phoneNumber": "+998901234567",
    "password": "password123"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Muvaffaqiyatli login qilindi"
}
```

**Error Response:**
- **Code:** 401 Unauthorized
```json
{
    "success": false,
    "message": "Noto'g'ri telefon raqam yoki parol"
}
```

### 2. Register
Register a new client.

**URL:** `/register`  
**Method:** `POST`  
**Auth Required:** No

**Request Body:**
```json
{
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+998901234567",
    "password": "password123"
}
```

**Success Response:**
- **Code:** 201 Created
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+998901234567",
        "isVerified": false,
        "createdAt": "2024-02-20T10:00:00.000Z"
    },
    "message": "Muvaffaqiyatli ro'yxatdan o'tildi"
}
```

**Error Response:**
- **Code:** 400 Bad Request
```json
{
    "success": false,
    "message": "Bu telefon raqam allaqachon ro'yxatdan o'tgan"
}
```

### 3. SMS Verification
Verify client's phone number using SMS code.

**URL:** `/verify-sms`  
**Method:** `POST`  
**Auth Required:** Yes

**Request Body:**
```json
{
    "smsCode": "123456"
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

**Error Response:**
- **Code:** 400 Bad Request
```json
{
    "success": false,
    "message": "Noto'g'ri yoki muddati o'tgan SMS kod"
}
```

### 4. Get Profile
Get client's profile information.

**URL:** `/profile`  
**Method:** `GET`  
**Auth Required:** Yes

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "user": {
        "_id": "user_id",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+998901234567",
        "image": "uploads/clients/user_id-1234567890.jpg",
        "isVerified": true,
        "createdAt": "2024-02-20T10:00:00.000Z"
    },
    "message": "Profil ma'lumotlari muvaffaqiyatli olindi"
}
```

### 5. Update Profile
Update client's profile information.

**URL:** `/profile`  
**Method:** `PUT`  
**Auth Required:** Yes

**Request Body:**
```json
{
    "firstName": "John",
    "lastName": "Smith"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Profil muvaffaqiyatli yangilandi"
}
```

### 6. Update Profile Image
Update client's profile image.

**URL:** `/profile/image`  
**Method:** `POST`  
**Auth Required:** Yes

**Request Body:**
```
Content-Type: multipart/form-data
Body: FormData with 'image' field
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Profil rasmi muvaffaqiyatli yangilandi"
}
```

**Error Response:**
- **Code:** 400 Bad Request
```json
{
    "success": false,
    "message": "Faqat rasm fayllari yuklanishi mumkin!"
}
```

### 7. Change Password
Change client's password.

**URL:** `/change-password`  
**Method:** `PUT`  
**Auth Required:** Yes

**Request Body:**
```json
{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword123"
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

**Error Response:**
- **Code:** 400 Bad Request
```json
{
    "success": false,
    "message": "Joriy parol noto'g'ri"
}
```

### 8. Logout
Logout client and invalidate token.

**URL:** `/logout`  
**Method:** `POST`  
**Auth Required:** Yes

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Muvaffaqiyatli chiqildi"
}
```

## Error Codes

- **400 Bad Request** - Invalid input data
- **401 Unauthorized** - Authentication required or invalid token
- **500 Internal Server Error** - Server error

## Data Types

### User Object
```typescript
interface User {
    _id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    image?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
```

## Notes

1. All phone numbers must be in the format: `+998XXXXXXXXX`
2. Passwords must be at least 6 characters long
3. Profile images must be in JPG, JPEG, or PNG format
4. Maximum file size for profile images is 5MB
5. JWT tokens expire after 24 hours
6. SMS verification codes expire after 5 minutes 