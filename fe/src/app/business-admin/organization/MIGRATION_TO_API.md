# Hướng dẫn chuyển từ Fake Data sang API

## Tổng quan
Hiện tại components đang dùng fake data trực tiếp trong component. Để chuyển sang dùng API thực:

## Các bước cần làm

### 1. OrganizationManagement Component

**File:** `fe/src/app/business-admin/organization/_components/OrganizationManagement.tsx`

**Bước 1:** Uncomment imports API
```typescript
// TỪ:
// import {
//   getOrganizations,
//   updateOrganizationStatus,
//   deleteOrganization,
// } from "../api";

// SANG:
import {
  getOrganizations,
  updateOrganizationStatus,
  deleteOrganization,
} from "../api";
```

**Bước 2:** Xóa fake data
```typescript
// XÓA:
// Fake data tạm thời
const generateFakeOrganizations = (): Organization[] => { ... };
const FAKE_ORGANIZATIONS = generateFakeOrganizations();
```

**Bước 3:** Xóa state `allOrganizations` và logic filter client-side
```typescript
// XÓA:
const [allOrganizations, setAllOrganizations] = useState<Organization[]>(FAKE_ORGANIZATIONS);

// XÓA:
const filteredAndPaginated = useMemo(() => {
  // ... all filter logic
}, [allOrganizations, filters, itemsPerPage]);
```

**Bước 4:** Thay thế `fetchOrganizations` function
```typescript
// TỪ:
const fetchOrganizations = async (queryParams: OrganizationQueryParams) => {
  setLoading(true);
  setError(null);
  setSuccess(null);

  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate delay

  try {
    setFilters(queryParams);
    setOrganizations(filteredAndPaginated.organizations);
    setTotalItems(filteredAndPaginated.total);
    setCurrentPage(filteredAndPaginated.page);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to fetch organizations";
    setError(errorMessage);
    setOrganizations([]);
    setTotalItems(0);
  } finally {
    setLoading(false);
  }
};

// SANG:
const fetchOrganizations = async (queryParams: OrganizationQueryParams) => {
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    const response: OrganizationResponse = await getOrganizations({
      ...queryParams,
      limit: itemsPerPage,
    });
    setOrganizations(response.organizations);
    setTotalItems(response.total);
    setCurrentPage(response.page);
    setFilters(queryParams);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to fetch organizations";
    setError(errorMessage);
    setOrganizations([]);
    setTotalItems(0);
  } finally {
    setLoading(false);
  }
};
```

**Bước 5:** Thay thế `handleUpdateStatus` (nếu có)
```typescript
// TỪ:
const handleUpdateStatus = async (
  orgId: string,
  newStatus: "ACTIVE" | "INACTIVE"
) => {
  setLoading(true);
  setError(null);
  setSuccess(null);
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    setAllOrganizations((prev) =>
      prev.map((org) =>
        org.id === orgId
          ? { ...org, status: newStatus, updatedAt: new Date().toISOString() }
          : org
      )
    );
    setSuccess("Organization status updated successfully");
    await fetchOrganizations(filters);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to update";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

// SANG:
const handleUpdateStatus = async (
  orgId: string,
  newStatus: "ACTIVE" | "INACTIVE"
) => {
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    await updateOrganizationStatus(orgId, newStatus);
    setSuccess("Organization status updated successfully");
    await fetchOrganizations(filters);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to update";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**Bước 6:** Thay thế `handleDelete`
```typescript
// TỪ:
const handleDelete = async (orgId: string | number) => {
  setLoading(true);
  setError(null);
  setSuccess(null);
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    setAllOrganizations((prev) => prev.filter((org) => org.id !== String(orgId)));
    setSuccess("Organization deleted successfully");
    await fetchOrganizations(filters);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to delete";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

// SANG:
const handleDelete = async (orgId: string | number) => {
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    await deleteOrganization(String(orgId));
    setSuccess("Organization deleted successfully");
    await fetchOrganizations(filters);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to delete";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**Bước 7:** Xóa useEffect phụ thuộc vào filteredAndPaginated
```typescript
// XÓA:
useEffect(() => {
  setOrganizations(filteredAndPaginated.organizations);
  setTotalItems(filteredAndPaginated.total);
  setCurrentPage(filteredAndPaginated.page);
}, [filteredAndPaginated]);
```

---

### 2. OrganizationDetail Component

**File:** `fe/src/app/business-admin/organization/[id]/_components/OrganizationDetail.tsx`

**Bước 1:** Uncomment import API (nếu có)
```typescript
// Thêm vào import:
import { getOrganization } from "../../api"; // Cần thêm function này vào api.ts
```

**Bước 2:** Thêm function getOrganization vào api.ts
```typescript
// Thêm vào: fe/src/app/business-admin/organization/api.ts

/**
 * Get organization detail by ID
 */
export async function getOrganization(id: string): Promise<Organization & {
  totalMembers?: number;
  totalDocuments?: number;
}> {
  const res = await apiClient.get<Organization & {
    totalMembers?: number;
    totalDocuments?: number;
  }>(`/organizations/${id}`);
  return res.data;
}
```

**Bước 3:** Xóa fake data
```typescript
// XÓA:
const FAKE_ORGANIZATIONS: (Organization & {
  totalMembers?: number;
  totalDocuments?: number;
})[] = [ ... ];
```

**Bước 4:** Thay thế `fetchOrganization`
```typescript
// TỪ:
const fetchOrganization = async () => {
  setLoading(true);
  setError(null);
  setSuccess(null);
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const found = FAKE_ORGANIZATIONS.find((org) => org.id === organizationId);
    if (!found) {
      // Fallback logic
      const fallback = { ... };
      setOrganization(fallback);
    } else {
      setOrganization(found);
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to fetch";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

// SANG:
const fetchOrganization = async () => {
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    const data = await getOrganization(organizationId);
    setOrganization(data);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to fetch organization";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

**Bước 5:** Thay thế `handleStatusUpdate`
```typescript
// TỪ:
const handleStatusUpdate = async (newStatus: "ACTIVE" | "INACTIVE") => {
  setLoading(true);
  setError(null);
  setSuccess(null);
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    if (organization) {
      setOrganization({
        ...organization,
        status: newStatus,
        active: newStatus === "ACTIVE",
        updatedAt: new Date().toISOString(),
      });
      setSuccess(`Organization status updated to ${newStatus} successfully`);
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to update";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

// SANG:
const handleStatusUpdate = async (newStatus: "ACTIVE" | "INACTIVE") => {
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    if (organization) {
      await updateOrganizationStatus(organization.id, newStatus);
      setSuccess(`Organization status updated to ${newStatus} successfully`);
      await fetchOrganization(); // Refresh data
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Failed to update";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

---

### 3. Cập nhật api.ts

**Thêm function getOrganization:**

```typescript
// fe/src/app/business-admin/organization/api.ts

/**
 * Get organization detail by ID
 */
export async function getOrganization(
  id: string
): Promise<Organization & {
  totalMembers?: number;
  totalDocuments?: number;
}> {
  const res = await apiClient.get<Organization & {
    totalMembers?: number;
    totalDocuments?: number;
  }>(`/organizations/${id}`);
  return res.data;
}
```

---

## Checklist

### OrganizationManagement
- [ ] Uncomment API imports
- [ ] Xóa `generateFakeOrganizations` function
- [ ] Xóa `FAKE_ORGANIZATIONS` constant
- [ ] Xóa `allOrganizations` state
- [ ] Xóa `filteredAndPaginated` useMemo
- [ ] Xóa useEffect phụ thuộc filteredAndPaginated
- [ ] Thay `fetchOrganizations` để gọi API
- [ ] Thay `handleUpdateStatus` để gọi API
- [ ] Thay `handleDelete` để gọi API

### OrganizationDetail
- [ ] Thêm `getOrganization` vào api.ts
- [ ] Import `getOrganization` và `updateOrganizationStatus`
- [ ] Xóa `FAKE_ORGANIZATIONS` constant
- [ ] Thay `fetchOrganization` để gọi API
- [ ] Thay `handleStatusUpdate` để gọi API

---

## Lưu ý

1. **API Base URL**: Đảm bảo `NEXT_PUBLIC_API_BASE_URL` đã được set trong `.env.local`
2. **Authentication**: Đảm bảo authentication đã được setup
3. **Error Handling**: API calls sẽ throw errors, cần handle đúng
4. **Loading States**: Loading states sẽ tự động work khi dùng API
5. **Pagination**: Backend sẽ handle pagination, không cần client-side pagination
6. **Filtering**: Backend sẽ handle filtering, không cần client-side filtering

---

## Testing

Sau khi chuyển sang API:
1. Test tất cả các filter/search
2. Test pagination
3. Test update status
4. Test delete
5. Test detail page
6. Test error cases (network errors, 404, etc.)


