# DeleteConfirmation Component

## Props

**Props của DeleteConfirmation**

| Tên prop      | Kiểu dữ liệu                     | Mặc định                   | Ý nghĩa/Chức năng                      |
|---------------|----------------------------------|----------------------------|----------------------------------------|
| `onDelete`    | `(id: string \| number) => Promise<void>` | **Bắt buộc**        | Hàm callback để xử lý việc xóa       |
| `itemId`      | `string \| number`               | **Bắt buộc**               | ID của item cần xóa                    |
| `itemName`    | `string`                         | **Bắt buộc**               | Tên item hiển thị trong modal          |
| `title`       | `string`                         | `"Confirm Delete"`         | Tiêu đề hộp thoại xác nhận             |
| `description` | `string`                         | `"Are you sure you want to delete this item?"` | Nội dung mô tả trong modal  |
| `size`        | `'sm'` \| `'md'` \| `'lg'`       | `'md'`                     | Kích thước của nút xóa                  |
| `variant`     | `'text'` \| `'outline'` \| `'solid'` | `'text'`                | Kiểu hiển thị nút xóa                  |

**Giải thích ngắn gọn:**

- **onDelete**: Hàm được gọi khi xác nhận xóa, truyền vào id của item.
- **itemId**: Giá trị id (string/number) của đối tượng muốn xóa.
- **itemName**: Tên đối tượng sẽ hiển thị nội dung trong modal.
- **title**: Tiêu đề trên modal.
- **description**: Dòng mô tả trong modal.
- **size**: Kích cỡ nút xóa (nhỏ, vừa, lớn).
- **variant**: Kiểu giao diện nút xóa (chữ, viền hoặc nền đỏ).

## Examples

### Basic
```tsx
<DeleteConfirmation
  onDelete={async (id) => {
    await deleteUserAPI(id);
    setUsers(prev => prev.filter(user => user.id !== id));
  }}
  itemId={user.id}
  itemName={user.name}
/>
```

### Custom
```tsx
<DeleteConfirmation
  onDelete={handleDeleteUser}
  itemId={user.id}
  itemName={user.name}
  title="Delete User"
  description={`Are you sure you want to delete user "${user.name}"?`}
  size="sm"
  variant="text"
/>
```

## Complete Example

```tsx
"use client";

import { useState } from "react";
import DeleteConfirmation from "@/components/ui/delete-confirmation";

const UsersPage = () => {
  const [users, setUsers] = useState([
    { id: "1", name: "John Doe", email: "john@example.com" },
    { id: "2", name: "Jane Smith", email: "jane@example.com" },
  ]);

  const handleDeleteUser = async (id: string | number) => {
    try {
      await deleteUserAPI(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div>
      <h1>Users</h1>
      <table>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>
              <DeleteConfirmation
                onDelete={handleDeleteUser}
                itemId={user.id}
                itemName={user.name}
                size="sm"
                variant="text"
              />
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
};

export default UsersPage;
```