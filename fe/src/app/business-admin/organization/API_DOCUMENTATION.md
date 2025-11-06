# Organization Management API Documentation

## Backend Entity Structure

```java
@Id
@GeneratedValue(strategy = GenerationType.UUID)
private UUID id;

@Column(unique = true, nullable = false)
private String email;

@Column(unique = true, nullable = false)
private String hotline;

private String logo;
private String address;

@Column(nullable = false)
private String status;  //#temp

private String adminName;
private String adminPassword;  // NOT returned in API
private String adminEmail;

@Column(nullable = false)
private Boolean active = true;

@Column(nullable = false)
private Boolean deleted = false;
```

---

## Base URL
```
/api/organizations
```

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations/{id}` | Get organization detail |
| POST | `/api/organizations` | Query organizations list |
| PATCH | `/api/organizations/{id}/status` | Update organization status |
| DELETE | `/api/organizations/{id}` | Delete organization |

---

## 1. GET Organization Detail

**Endpoint:** `GET /api/organizations/{id}`

**Path Params:** `id` (UUID, required)

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "tech-solutions-inc@example.com",
  "hotline": "+11234567890",
  "logo": "https://example.com/logo.png",
  "address": "123 Tech Street, San Francisco, CA 94102",
  "status": "ACTIVE",
  "adminName": "John Admin",
  "adminEmail": "admin.tech-solutions-inc@example.com",
  "active": true,
  "deleted": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T15:45:00.000Z",
  "totalMembers": 150,        // Optional - computed field
  "totalDocuments": 324       // Optional - computed field
}
```

**Errors:** 404 (Not Found), 500 (Server Error)

---

## 2. POST Query Organizations
**Endpoint:** `POST /api/organizations`

**Request Body:**
```json
{
  "page": 1,                    // Optional, default: 1
  "limit": 10,                  // Optional, default: 10, max: 100
  "search": "",                  // Optional - search in email, hotline, adminEmail, address
  "status": "",                  // Optional - "ACTIVE" | "INACTIVE" | ""
  "sortBy": "createdAt",        // Optional - "email" | "hotline" | "status" | "createdAt" | "active"(default: "createdAt")
  "sortOrder": "desc",          // Optional - "asc" | "desc" (default: "desc")
  "dateFrom": "",                // Optional - "YYYY-MM-DD"
  "dateTo": ""                   // Optional - "YYYY-MM-DD"
}
```

**Response (200 OK):**
```json
{
  "organizations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "tech-solutions-inc@example.com",
      "hotline": "+11234567890",
      "logo": "https://example.com/logo.png",
      "address": "123 Tech Street, San Francisco, CA 94102",
      "status": "ACTIVE",
      "adminName": "John Admin",
      "adminEmail": "admin.tech-solutions-inc@example.com",
      "active": true,
      "deleted": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T15:45:00.000Z"
    }
  ],
  "total": 25,                  // Total matching (excluding deleted)
  "page": 1,
  "limit": 10
}
```

**Errors:** 400 (Bad Request), 500 (Server Error)

**Notes:**
- Use POST instead of GET to avoid long URLs
- Filter out `deleted = true` organizations
- Search is case-insensitive, partial match
- Status filter: `"ACTIVE"` → `status = "ACTIVE" OR active = true`
- Date range: compares with `createdAt`

---

## 3. PATCH Update Status

**Endpoint:** `PATCH /api/organizations/{id}/status`

**Path Params:** `id` (UUID, required)

**Request Body:**
```json
{
  "status": "ACTIVE"             // Required - "ACTIVE" | "INACTIVE"
}
```

**Backend Logic:**
```java
if ("ACTIVE".equals(status)) {
    organization.setActive(true);
    organization.setStatus("ACTIVE");
} else if ("INACTIVE".equals(status)) {
    organization.setActive(false);
    organization.setStatus("INACTIVE");
}
organization.setUpdatedAt(now());
```

**Response (200 OK):** Returns updated Organization object

**Errors:** 400 (Bad Request), 404 (Not Found), 500 (Server Error)

---

## 4. DELETE Organization

**Endpoint:** `DELETE /api/organizations/{id}`

**Path Params:** `id` (UUID, required)

**Response (200 OK):**
```json
{
  "message": "Organization deleted successfully"
}
```

**Implementation:**
- **Recommended**: Soft delete (set `deleted = true`)
- Hard delete: Optional, based on business logic

**Errors:** 404 (Not Found), 500 (Server Error)

---

## Data Model

### Organization Interface
```typescript
interface Organization {
  id: string;                    // UUID
  email: string;                 // unique, not null
  hotline: string;               // unique, not null
  logo?: string;                 // optional
  address?: string;               // optional
  status: string;                // temp field
  adminName?: string;             // optional
  adminEmail: string;             // required
  active: boolean;                // default true
  deleted: boolean;               // default false
  createdAt: string;              // ISO 8601
  updatedAt?: string;             // ISO 8601, optional
  totalMembers?: number;          // Optional - computed for detail
  totalDocuments?: number;        // Optional - computed for detail
}
```

### OrganizationResponse Interface
```typescript
interface OrganizationResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
}
```

---

## Important Notes

### Security
- **NEVER** return `adminPassword` in API responses

### Status vs Active
- `status`: String field (temp), values: "ACTIVE", "INACTIVE", or others
- `active`: Boolean field (default: true)
- When updating status, update both fields:
  - `status = "ACTIVE"` → `active = true`
  - `status = "INACTIVE"` → `active = false`
- Filter logic: `"ACTIVE"` matches `status = "ACTIVE" OR active = true`

### Deleted Organizations
- List query: Exclude `deleted = true` organizations
- Detail query: Can return deleted organization if needed

### Search Logic
- Case-insensitive, partial match (LIKE query)
- Search in: `email`, `hotline`, `adminEmail`, `address`

### Sort Options
- Fields: `email`, `hotline`, `status`, `createdAt`, `active`
- Default: `createdAt` descending

### Pagination
- Default: `page = 1`, `limit = 10`
- Max limit: 100 (recommended)
- Empty results: Return `[]` with `total: 0`

### Date Format
- Request: `"YYYY-MM-DD"` or full ISO string
- Response: Full ISO string: `"2024-01-15T10:30:00.000Z"`

### Computed Fields (Optional)
- `totalMembers`: Count members in organization
- `totalDocuments`: Count documents in organization
- Only needed for detail endpoint

---

## Authentication

All endpoints require authentication:
- Cookie: `access_token` (httpOnly)
- Or header: `Authorization: Bearer <token>`

---

## Error Response Format

All errors follow this format:
```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Quick Examples

### Get Detail
```bash
GET /api/organizations/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

### Query List
```bash
POST /api/organizations
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "ACTIVE",
  "sortBy": "email",
  "page": 1,
  "limit": 10
}
```

### Update Status
```bash
PATCH /api/organizations/550e8400-e29b-41d4-a716-446655440000/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "INACTIVE"
}
```

### Delete
```bash
DELETE /api/organizations/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

---

## Summary

**Required Endpoints:**
1. `GET /api/organizations/{id}` - Get detail
2. `POST /api/organizations` - Query list
3. `PATCH /api/organizations/{id}/status` - Update status
4. `DELETE /api/organizations/{id}` - Delete

**Key Points:**
- Use POST for list query (not GET)
- Filter out deleted organizations (`deleted = false`)
- Update both `status` and `active` when updating status
- Never return `adminPassword`
- Support computed fields: `totalMembers`, `totalDocuments` (optional, for detail)
