# Category API Documentation

## Base URL
```
http://localhost:5000/api/category
```

## Authentication
All endpoints require authentication using JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Category Endpoints

### 1. Create Category
Create a new main category.

**URL:** `/category/create`  
**Method:** `POST`  
**Auth Required:** Yes

**Request Body:**
```json
{
    "name": "Electronics"
}
```

**Success Response:**
- **Code:** 201 Created
```json
{
    "success": true,
    "message": "Kategoriya muvaffaqiyatli yaratildi",
    "category": {
        "id": "category_id",
        "name": "Electronics",
        "slug": "electronics",
        "parent": null,
        "status": "active",
        "createdBy": {
            "id": "admin_id",
            "name": "Admin Name"
        },
        "createdAt": "2024-02-20T10:00:00.000Z"
    }
}
```

### 2. Update Category
Update category name.

**URL:** `/category/:id`  
**Method:** `PUT`  
**Auth Required:** Yes

**Request Body:**
```json
{
    "name": "New Category Name"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Kategoriya muvaffaqiyatli yangilandi",
    "category": {
        "id": "category_id",
        "name": "New Category Name",
        "slug": "new-category-name",
        "parent": null,
        "status": "active",
        "createdBy": {
            "id": "admin_id",
            "name": "Admin Name"
        },
        "createdAt": "2024-02-20T10:00:00.000Z"
    }
}
```

### 3. Update Category Status
Update category status (active/inactive).

**URL:** `/category/:id/status`  
**Method:** `PUT`  
**Auth Required:** Yes

**Request Body:**
```json
{
    "status": "inactive"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Kategoriya statusi muvaffaqiyatli o'zgartirildi",
    "category": {
        "id": "category_id",
        "name": "Category Name",
        "status": "inactive"
    }
}
```

### 4. Delete Category
Delete a category.

**URL:** `/category/:id`  
**Method:** `DELETE`  
**Auth Required:** Yes

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Kategoriya muvaffaqiyatli o'chirildi"
}
```

### 5. Get Categories
Get list of all main categories with their subcategories.

**URL:** `/category/list`  
**Method:** `GET`  
**Auth Required:** Yes

**Query Parameters:**
- `status` (optional): Filter by status ('active' or 'inactive')

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "count": 2,
    "categories": [
        {
            "id": "category_id",
            "name": "Electronics",
            "slug": "electronics",
            "parent": null,
            "status": "active",
            "createdBy": {
                "id": "admin_id",
                "name": "Admin Name"
            },
            "subcategories": [
                {
                    "id": "subcategory_id",
                    "name": "Smartphones",
                    "slug": "smartphones",
                    "status": "active",
                    "createdBy": {
                        "id": "admin_id",
                        "name": "Admin Name"
                    },
                    "createdAt": "2024-02-20T10:00:00.000Z"
                }
            ],
            "createdAt": "2024-02-20T10:00:00.000Z"
        }
    ]
}
```

## Subcategory Endpoints

### 1. Create Subcategory
Create a new subcategory under a parent category.

**URL:** `/subcategory/create`  
**Method:** `POST`  
**Auth Required:** Yes

**Request Body:**
```json
{
    "name": "Smartphones",
    "parentId": "parent_category_id"
}
```

**Success Response:**
- **Code:** 201 Created
```json
{
    "success": true,
    "message": "Subkategoriya muvaffaqiyatli yaratildi",
    "subcategory": {
        "id": "subcategory_id",
        "name": "Smartphones",
        "slug": "smartphones",
        "parent": {
            "id": "parent_id",
            "name": "Electronics"
        },
        "status": "active",
        "createdBy": {
            "id": "admin_id",
            "name": "Admin Name"
        },
        "createdAt": "2024-02-20T10:00:00.000Z"
    }
}
```

### 2. Update Subcategory
Update subcategory name or parent category.

**URL:** `/subcategory/:id`  
**Method:** `PUT`  
**Auth Required:** Yes

**Request Body:**
```json
{
    "name": "New Subcategory Name",
    "parentId": "new_parent_category_id"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Subkategoriya muvaffaqiyatli yangilandi",
    "subcategory": {
        "id": "subcategory_id",
        "name": "New Subcategory Name",
        "slug": "new-subcategory-name",
        "parent": {
            "id": "parent_id",
            "name": "Parent Category"
        },
        "status": "active",
        "createdBy": {
            "id": "admin_id",
            "name": "Admin Name"
        },
        "createdAt": "2024-02-20T10:00:00.000Z"
    }
}
```

### 3. Update Subcategory Status
Update subcategory status (active/inactive).

**URL:** `/subcategory/:id/status`  
**Method:** `PUT`  
**Auth Required:** Yes

**Request Body:**
```json
{
    "status": "inactive"
}
```

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Kategoriya statusi muvaffaqiyatli o'zgartirildi",
    "category": {
        "id": "subcategory_id",
        "name": "Subcategory Name",
        "status": "inactive"
    }
}
```

### 4. Delete Subcategory
Delete a subcategory.

**URL:** `/subcategory/:id`  
**Method:** `DELETE`  
**Auth Required:** Yes

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "message": "Subkategoriya muvaffaqiyatli o'chirildi"
}
```

### 5. Get Subcategories
Get list of subcategories for a specific parent category.

**URL:** `/subcategory/list`  
**Method:** `GET`  
**Auth Required:** Yes

**Query Parameters:**
- `status` (optional): Filter by status ('active' or 'inactive')
- `parentId` (required): Parent category ID

**Success Response:**
- **Code:** 200 OK
```json
{
    "success": true,
    "count": 2,
    "subcategories": [
        {
            "id": "subcategory_id",
            "name": "Smartphones",
            "slug": "smartphones",
            "parent": {
                "id": "parent_id",
                "name": "Electronics"
            },
            "status": "active",
            "createdBy": {
                "id": "admin_id",
                "name": "Admin Name"
            },
            "createdAt": "2024-02-20T10:00:00.000Z"
        }
    ]
}
```

## Error Codes

- **400 Bad Request** - Invalid input data
- **401 Unauthorized** - Authentication required or invalid token
- **404 Not Found** - Category/Subcategory not found
- **500 Internal Server Error** - Server error

## Data Types

### Category Object
```typescript
interface Category {
    id: string;
    name: string;
    slug: string;
    parent: null;
    status: 'active' | 'inactive';
    createdBy: {
        id: string;
        name: string;
    };
    subcategories?: Subcategory[];
    createdAt: Date;
}
```

### Subcategory Object
```typescript
interface Subcategory {
    id: string;
    name: string;
    slug: string;
    parent: {
        id: string;
        name: string;
    };
    status: 'active' | 'inactive';
    createdBy: {
        id: string;
        name: string;
    };
    createdAt: Date;
}
```

## Notes

### Category Rules
1. Category names must be at least 2 characters long
2. Category names must be unique
3. Categories cannot have a parent
4. Categories with subcategories cannot be deleted
5. When a category is deactivated, all its subcategories are also deactivated

### Subcategory Rules
1. Subcategory names must be at least 2 characters long
2. Subcategory names must be unique within the same parent
3. Subcategories must have a parent category
4. Parent category must be active to create or update subcategories
5. Subcategories can be moved between parent categories
6. Circular dependencies in parent-child relationships are not allowed
7. A subcategory cannot be its own parent 