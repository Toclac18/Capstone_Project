# Toast Notification System

## Quick Start

### 1. Import và sử dụng
```tsx
import { useToast } from "@/components/ui/toast";

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully',
      duration: 3000
    });
  };
}
```

### 2. Các loại Toast
```tsx
// Success (xanh lá)
showToast({
  type: 'success',
  title: 'User Created',
  message: 'New user has been created successfully'
});

// Error (đỏ)
showToast({
  type: 'error',
  title: 'Error',
  message: 'Failed to save data. Please try again.'
});

// Warning (vàng)
showToast({
  type: 'warning',
  title: 'Warning',
  message: 'This action cannot be undone'
});

// Info (xanh dương)
showToast({
  type: 'info',
  title: 'Information',
  message: 'Please review your changes'
});
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `'success' \| 'error' \| 'warning' \| 'info'` | **Required** | Loại toast |
| `title` | `string` | **Required** | Tiêu đề toast |
| `message` | `string` | `undefined` | Nội dung chi tiết |
| `duration` | `number` | `5000` | Thời gian hiển thị (ms), 0 = không tự động ẩn |

## Examples

### API Integration
```tsx
const handleSaveUser = async (userData) => {
  try {
    await userService.createUser(userData);
    showToast({
      type: 'success',
      title: 'User Created',
      message: 'New user has been created successfully'
    });
  } catch (error) {
    showToast({
      type: 'error',
      title: 'Creation Failed',
      message: 'Failed to create user. Please try again.'
    });
  }
};
```

### Form Validation
```tsx
const handleSubmit = (formData) => {
  if (!formData.email) {
    showToast({
      type: 'error',
      title: 'Validation Error',
      message: 'Email is required'
    });
    return;
  }
  }
};
```