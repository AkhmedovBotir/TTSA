# Market User Mobile App

Bu React Native ilovasi User Mobile API bilan integratsiya qilingan bo'lib, foydalanuvchilar uchun mahsulotlarni ko'rish, savatchaga qo'shish va buyurtma berish imkoniyatini beradi.

## Xususiyatlar

### 🔐 Autentifikatsiya
- Foydalanuvchi ro'yxatdan o'tish
- Tizimga kirish
- Parolni unutib qo'ygan holda tiklash
- JWT token bilan autentifikatsiya

### 🛍️ Mahsulotlar
- Barcha mahsulotlarni ko'rish
- Mahsulotlarni qidirish
- Kategoriya bo'yicha filtrlash
- Chegirmali mahsulotlarni ko'rish
- Yangi mahsulotlarni ko'rish
- Mahsulot tafsilotlarini ko'rish

### 🛒 Savatcha
- Mahsulotlarni savatchaga qo'shish
- Savatchadagi mahsulot miqdorini o'zgartirish
- Savatchadan mahsulotni o'chirish
- Savatchani tozalash
- Savatcha ma'lumotlarini ko'rish

### 📋 Buyurtmalar
- Yangi buyurtma yaratish
- Buyurtmalar tarixini ko'rish
- Buyurtma tafsilotlarini ko'rish
- Buyurtmani bekor qilish
- Buyurtma statistikasini ko'rish

### 👤 Profil
- Shaxsiy ma'lumotlarni ko'rish va tahrirlash
- Parolni o'zgartirish
- Buyurtmalar tarixini ko'rish
- Tizimdan chiqish

## Texnologiyalar

- **React Native** - Mobil ilova framework
- **Expo Router** - Navigatsiya
- **TypeScript** - Type safety
- **Axios** - HTTP so'rovlar
- **AsyncStorage** - Ma'lumotlarni saqlash
- **Context API** - State management

## O'rnatish

1. **Dependencies o'rnatish:**
```bash
npm install
```

2. **Ilovani ishga tushirish:**
```bash
npm start
```

3. **Android uchun:**
```bash
npm run android
```

4. **iOS uchun:**
```bash
npm run ios
```

## API Konfiguratsiyasi

API base URL ni `app/services/api.ts` faylida o'zgartiring:

```typescript
const BASE_URL = 'http://your-api-url.com/api/user-mobile';
```

## Loyiha Strukturasi

```
app/
├── components/          # Umumiy komponentlar
│   ├── Button.tsx
│   ├── Input.tsx
│   └── ProductCard.tsx
├── contexts/           # Context API
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── screens/            # Ekranlar
│   ├── HomeScreen.tsx
│   ├── CartScreen.tsx
│   └── auth/
│       ├── LoginScreen.tsx
│       ├── RegisterScreen.tsx
│       └── ForgotPasswordScreen.tsx
├── services/           # API xizmatlari
│   └── api.ts
├── (tabs)/            # Tab navigatsiya
│   ├── index.tsx
│   ├── products.tsx
│   ├── cart.tsx
│   ├── orders.tsx
│   └── profile.tsx
└── auth/              # Autentifikatsiya ekranlari
    ├── login.tsx
    ├── register.tsx
    └── forgot-password.tsx
```

## API Endpointlar

### Autentifikatsiya
- `POST /register` - Ro'yxatdan o'tish
- `POST /login` - Tizimga kirish
- `POST /logout` - Tizimdan chiqish
- `POST /forgot-password` - Parolni tiklash

### Profil
- `GET /profile` - Profil ma'lumotlarini olish
- `PUT /profile` - Profilni yangilash
- `PUT /change-password` - Parolni o'zgartirish

### Mahsulotlar
- `GET /products` - Barcha mahsulotlarni olish
- `GET /products/{id}` - Bitta mahsulotni olish
- `GET /products/search` - Mahsulotlarni qidirish
- `GET /products/discounted` - Chegirmali mahsulotlar
- `GET /products/new` - Yangi mahsulotlar

### Savatcha
- `GET /cart` - Savatchani olish
- `POST /cart/add` - Mahsulot qo'shish
- `PUT /cart/items/{id}/quantity` - Miqdorni o'zgartirish
- `DELETE /cart/items/{id}` - Mahsulotni o'chirish
- `DELETE /cart/clear` - Savatchani tozalash

### Buyurtmalar
- `POST /orders` - Buyurtma yaratish
- `GET /orders` - Buyurtmalarni olish
- `GET /orders/{id}` - Bitta buyurtmani olish
- `PUT /orders/{id}/cancel` - Buyurtmani bekor qilish
- `GET /orders/stats` - Buyurtma statistikasi

## Xavfsizlik

- JWT token avtomatik ravishda saqlanadi va har bir so'rovda yuboriladi
- Token muddati tugaganda avtomatik ravishda tizimdan chiqariladi
- Barcha xavfsiz endpointlar autentifikatsiya talab qiladi

## Xatoliklar

- Network xatoliklari avtomatik ravishda boshqariladi
- Foydalanuvchiga tushunarli xatolik xabarlari ko'rsatiladi
- Loading holatlari to'g'ri ko'rsatiladi

## Rivojlantirish

1. Yangi xususiyat qo'shish uchun tegishli ekran va komponentlarni yarating
2. API endpointlarini `api.ts` faylida qo'shing
3. TypeScript tiplarini to'g'ri belgilang
4. Xatoliklarni to'g'ri boshqaring

## Litsenziya

MIT License
