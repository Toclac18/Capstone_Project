# EditConfirmation Component

## Props

**Props của EditConfirmation**

| Tên prop      | Kiểu dữ liệu                     | Mặc định                   | Ý nghĩa/Chức năng                      |
|---------------|----------------------------------|----------------------------|----------------------------------------|
| `onSave`      | `(id: string \| number, data: Record<string, any>) => Promise<void>` | **Bắt buộc**        | Hàm callback để xử lý việc lưu dữ liệu |
| `itemId`      | `string \| number`               | **Bắt buộc**               | ID của item cần chỉnh sửa             |
| `itemName`    | `string`                         | **Bắt buộc**               | Tên item hiển thị trong modal          |
| `initialData` | `Record<string, any>`            | **Bắt buộc**               | Dữ liệu ban đầu để điền vào form       |
| `fields`      | `FormField[]`                    | **Bắt buộc**               | Cấu hình các trường form               |
| `title`       | `string`                         | `"Edit Item"`              | Tiêu đề hộp thoại chỉnh sửa            |
| `description` | `string`                         | `"Update the information below"` | Nội dung mô tả trong modal  |
| `size`        | `'sm'` \| `'md'` \| `'lg'`       | `'md'`                     | Kích thước của nút edit                |
| `variant`     | `'text'` \| `'outline'` \| `'solid'` | `'text'`                | Kiểu hiển thị nút edit                 |
| `className`   | `string`                         | `''`                      | CSS class tùy chỉnh                    |

**FormField Interface:**

| Tên prop      | Kiểu dữ liệu                     | Mặc định                   | Ý nghĩa/Chức năng                      |
|---------------|----------------------------------|----------------------------|----------------------------------------|
| `name`         | `string`                         | **Bắt buộc**               | Tên trường dữ liệu                     |
| `label`        | `string`                         | **Bắt buộc**               | Nhãn hiển thị cho trường                |
| `type`         | `'text' \| 'email' \| 'number' \| 'textarea' \| 'select' \| 'checkbox'` | **Bắt buộc** | Loại input field                       |
| `required`     | `boolean`                        | `false`                    | Trường bắt buộc hay không              |
| `placeholder`  | `string`                         | `undefined`                | Text placeholder                       |
| `options`      | `{value: string\|number, label: string}[]` | `undefined` | Options cho select dropdown            |
| `validation`   | `(value: any) => string \| null` | `undefined`                | Hàm validation tùy chỉnh               |

**Giải thích ngắn gọn:**

- **onSave**: Hàm được gọi khi xác nhận lưu, truyền vào id và dữ liệu đã chỉnh sửa.
- **itemId**: Giá trị id (string/number) của đối tượng muốn chỉnh sửa.
- **itemName**: Tên đối tượng sẽ hiển thị nội dung trong modal.
- **initialData**: Dữ liệu ban đầu để điền vào các trường form.
- **fields**: Mảng cấu hình các trường form với loại input và validation.
- **title**: Tiêu đề trên modal.
- **description**: Dòng mô tả trong modal.
- **size**: Kích cỡ nút edit (nhỏ, vừa, lớn).
- **variant**: Kiểu giao diện nút edit (chữ, viền hoặc nền xanh).

## Examples

### Basic
```tsx
<EditConfirmation
  onSave={async (id, data) => {
    await updateUserAPI(id, data);
    setUsers(prev => prev.map(user => user.id === id ? {...user, ...data} : user));
  }}
  itemId={user.id}
  itemName={user.name}
  initialData={user}
  fields={[
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true }
  ]}
/>
```

### Advanced với Validation
```tsx
<EditConfirmation
  onSave={handleEditUser}
  itemId={user.id}
  itemName={user.name}
  initialData={user}
  fields={[
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter user name',
      validation: (value) => value.length < 2 ? 'Name must be at least 2 characters' : null
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email address',
      validation: (value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email format' : null
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' }
      ]
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox'
    }
  ]}
  title="Edit User"
  description="Update user information"
  size="sm"
  variant="outline"
/>
```

### Document Edit Example
```tsx
<EditConfirmation
  onSave={handleEditDocument}
  itemId={document.id}
  itemName={document.title}
  initialData={document}
  fields={[
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      placeholder: 'Enter document title'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter document description'
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'research', label: 'Research' },
        { value: 'academic', label: 'Academic' },
        { value: 'business', label: 'Business' }
      ]
    },
    {
      name: 'price',
      label: 'Price (USD)',
      type: 'number',
      required: true,
      validation: (value) => value < 0 ? 'Price cannot be negative' : null
    },
    {
      name: 'isPublic',
      label: 'Public Document',
      type: 'checkbox'
    }
  ]}
  title="Edit Document"
  description="Update document information"
/>
```

## Complete Example

```tsx
"use client";

import { useState } from "react";
import EditConfirmation from "@/components/ui/edit-confirmation";
import DeleteConfirmation from "@/components/ui/delete-confirmation";

const UsersPage = () => {
  const [users, setUsers] = useState([
    { 
      id: "1", 
      name: "John Doe", 
      email: "john@example.com", 
      role: "admin",
      isActive: true 
    },
    { 
      id: "2", 
      name: "Jane Smith", 
      email: "jane@example.com", 
      role: "user",
      isActive: false 
    },
  ]);

  const handleEditUser = async (id: string | number, data: Record<string, any>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, ...data } : user
      ));
      
      console.log(`Updated user with id: ${id}`, data);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleDeleteUser = async (id: string | number) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prev => prev.filter(user => user.id !== id));
      console.log(`Deleted user with id: ${id}`);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Users Management</h1>
      
      <div className="space-y-4">
        {users.map(user => (
          <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email} • {user.role}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <EditConfirmation
                onSave={handleEditUser}
                itemId={user.id}
                itemName={user.name}
                initialData={user}
                fields={[
                  {
                    name: 'name',
                    label: 'Name',
                    type: 'text',
                    required: true,
                    validation: (value) => value.length < 2 ? 'Name too short' : null
                  },
                  {
                    name: 'email',
                    label: 'Email',
                    type: 'email',
                    required: true,
                    validation: (value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email' : null
                  },
                  {
                    name: 'role',
                    label: 'Role',
                    type: 'select',
                    required: true,
                    options: [
                      { value: 'admin', label: 'Admin' },
                      { value: 'user', label: 'User' }
                    ]
                  },
                  {
                    name: 'isActive',
                    label: 'Active',
                    type: 'checkbox'
                  }
                ]}
                title="Edit User"
                description="Update user information"
                size="sm"
                variant="outline"
              />
              
              <DeleteConfirmation
                onDelete={handleDeleteUser}
                itemId={user.id}
                itemName={user.name}
                title="Delete User"
                description={`Are you sure you want to delete user "${user.name}"?`}
                size="sm"
                variant="text"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersPage;
```

## Field Types

### Text Input
```tsx
{
  name: 'title',
  label: 'Title',
  type: 'text',
  required: true,
  placeholder: 'Enter title'
}
```

### Email Input
```tsx
{
  name: 'email',
  label: 'Email',
  type: 'email',
  required: true,
  validation: (value) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email' : null
}
```

### Number Input
```tsx
{
  name: 'price',
  label: 'Price',
  type: 'number',
  required: true,
  validation: (value) => value < 0 ? 'Price cannot be negative' : null
}
```

### Textarea
```tsx
{
  name: 'description',
  label: 'Description',
  type: 'textarea',
  placeholder: 'Enter description'
}
```

### Select Dropdown
```tsx
{
  name: 'category',
  label: 'Category',
  type: 'select',
  required: true,
  options: [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]
}
```

### Checkbox
```tsx
{
  name: 'isActive',
  label: 'Active',
  type: 'checkbox'
}
```

## Validation Examples

### Required Field
```tsx
{
  name: 'name',
  label: 'Name',
  type: 'text',
  required: true
}
```

### Custom Validation
```tsx
{
  name: 'username',
  label: 'Username',
  type: 'text',
  required: true,
  validation: (value) => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  }
}
```

### Email Validation
```tsx
{
  name: 'email',
  label: 'Email',
  type: 'email',
  required: true,
  validation: (value) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }
}
```

## Styling Variants

### Text Variant (Default)
```tsx
<EditConfirmation
  // ... other props
  variant="text"
/>
```

### Outline Variant
```tsx
<EditConfirmation
  // ... other props
  variant="outline"
/>
```

### Solid Variant
```tsx
<EditConfirmation
  // ... other props
  variant="solid"
/>
```

## Size Options

### Small
```tsx
<EditConfirmation
  // ... other props
  size="sm"
/>
```

### Medium (Default)
```tsx
<EditConfirmation
  // ... other props
  size="md"
/>
```

### Large
```tsx
<EditConfirmation
  // ... other props
  size="lg"
/>
```
