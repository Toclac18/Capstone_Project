# Frontend - Readee
Lưu ý: Khi tạo màn hình mới thì chỉ cần tạo thư mục mới ở trong app và file trong thư mục đấy có tên là page.tsx hoặc route.ts thì lúc đấy URL để truy cập trang đấy sẽ là route đến folder đấy từ app

---

## 🛠 Công nghệ sử dụng

### Core Technologies:
- **Next.js**: 15.0.3 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.9.3
- **Tailwind CSS**: 3.4.16

### Key Libraries:
- **Authentication**: jose (JWT verification)
- **HTTP Client**: axios
- **Charts**: ApexCharts + react-apexcharts
- **Date Picker**: flatpickr
- **Theming**: next-themes
- **UI Utilities**: clsx, tailwind-merge, class-variance-authority

### Development Tools:
- ESLint + TypeScript ESLint
- Prettier + Prettier Tailwind Plugin
- PostCSS + Autoprefixer

---

## 📁 Cấu trúc thư mục

```
fe/
├── public/                          # Static assets
│   ├── file.svg
│   └── globe.svg
│
├── src/
│   ├── app/                         # App Router (Next.js 15)
│   │   ├── (home)/                  # Route group - Trang chủ
│   │   │   └── page.tsx
│   │   │
│   │   ├── (template)/              # Route group - Template pages
│   │   │   ├── charts/
│   │   │   │   └── basic-chart/
│   │   │   │       └── page.tsx
│   │   │   ├── forms/
│   │   │   │   ├── form-elements/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── form-layout/
│   │   │   │       ├── _components/
│   │   │   │       └── page.tsx
│   │   │   ├── tables/
│   │   │   │   └── page.tsx
│   │   │   └── ui-elements/
│   │   │       ├── alerts/
│   │   │       │   └── page.tsx
│   │   │       └── buttons/
│   │   │           └── page.tsx
│   │   │
│   │   ├── admin/                   # Admin routes (Protected)
│   │   │   └── dashboard/
│   │   │       ├── _components/
│   │   │       │   └── overview-cards/
│   │   │       ├── fetch.ts
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                     # API Routes (Proxy to Backend)
│   │   │   └── users/
│   │   │       └── route.ts
│   │   │
│   │   ├── auth/                    # Authentication pages (Public)
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   └── sign-up/
│   │   │       └── page.tsx
│   │   │
│   │   ├── profile/                 # User profile (Protected)
│   │   │   └── page.tsx
│   │   │
│   │   ├── change-profile/          # Profile settings (Protected)
│   │   │   ├── _components/
│   │   │   └── page.tsx
│   │   │
│   │   ├── layout.tsx               # Root layout
│   │   ├── ConditionalLayout.tsx    # Layout với Sidebar/Header
│   │   └── providers.tsx            # Context Providers
│   │
│   ├── assets/                      # Icons và logos
│   │   ├── icons.tsx
│   │   └── logos/
│   │
│   ├── components/                  # React Components
│   │   ├── Layouts/                 # Layout components
│   │   │   ├── header/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── notification/
│   │   │   │   ├── theme-toggle/
│   │   │   │   └── user-info/
│   │   │   └── sidebar/
│   │   │       ├── data/
│   │   │       ├── index.tsx
│   │   │       ├── menu-item.tsx
│   │   │       └── sidebar-context.tsx
│   │   │
│   │   ├── Charts/                  # Chart components
│   │   │   ├── campaign-visitors/
│   │   │   ├── payments-overview/
│   │   │   ├── used-devices/
│   │   │   └── weeks-profit/
│   │   │
│   │   ├── FormElements/            # Form inputs
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio.tsx
│   │   │   ├── select.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── Checkboxes/
│   │   │   ├── DatePicker/
│   │   │   ├── InputGroup/
│   │   │   └── Switchers/
│   │   │
│   │   ├── Tables/                  # Table components
│   │   │   ├── invoice-table.tsx
│   │   │   ├── top-channels/
│   │   │   └── top-products/
│   │   │
│   │   ├── ui/                      # Base UI components
│   │   │   ├── dropdown.tsx
│   │   │   ├── skeleton.tsx         # Loading skeleton
│   │   │   └── table.tsx
│   │   │
│   │   └── ui-elements/             # UI elements
│   │       ├── alert/
│   │       └── button.tsx
│   │
│   ├── css/                         # Global styles
│   │   ├── satoshi.css
│   │   └── style.css
│   │
│   ├── fonts/                       # Custom fonts (Satoshi)
│   │   └── Satoshi-*.{eot,ttf,woff,woff2}
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── use-click-outside.ts
│   │   └── use-mobile.ts
│   │
│   ├── services/                    # API Services
│   │   ├── charts.services.ts       # Mock data cho charts
│   │   └── userService.ts           # User API service
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── icon-props.ts
│   │   ├── index.ts
│   │   └── user.ts
│   │
│   ├── utils/                       # Utility functions
│   │   ├── format-number.ts
│   │   ├── timeframe-extractor.ts
│   │   └── utils.ts
│   │
│   └── middleware.ts                # Next.js Middleware (JWT Auth)
│
├── .eslintrc.json                   # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── next-env.d.ts                    # Next.js TypeScript definitions
├── package.json                     # Dependencies và scripts
├── postcss.config.js                # PostCSS configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # Documentation (this file)
```

---

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js: 22.19.0
- npm: >=10

### Cài đặt dependencies
```bash
npm install
```

### Scripts có sẵn

2. Run the development server:
```bash
# Chạy development server (http://localhost:3000)
npm run dev

# Build cho production
npm run build

# Chạy production server
npm start

# Chạy ESLint để check lỗi
npm run lint

# Chạy Debug Mode
DEBUG=* npm run dev
```

### Environment Variables

Tạo file `.env.local`:
```env
# API Configuration
NEXT_PUBLIC_API_URL=/api
BACKEND_API_BASE=http://localhost:8080

# JWT Secret
NEXT_PUBLIC_JWT_SECRET=your-secret-key


## 🔐 Authentication

### JWT-based Authentication

Ứng dụng sử dụng JWT tokens được lưu trong cookies (`access_token`).

### Middleware Protection

File: `src/middleware.ts`

**Public Routes (không cần đăng nhập):**
- `/` - Trang chủ
- `/auth/sign-in` - Đăng nhập
- `/auth/sign-up` - Đăng ký

**Protected Routes (yêu cầu đăng nhập):**
- Tất cả routes khác đều yêu cầu authentication
- Nếu chưa đăng nhập → redirect về `/auth/sign-in?next={current-path}`

### Common Issues

**1. Middleware không hoạt động:**
- Kiểm tra file `src/middleware.ts` tồn tại
- Restart dev server

**2. API calls fail:**
- Kiểm tra `BACKEND_API_BASE` trong `.env.local`
- Kiểm tra backend server đang chạy

**3. Authentication issues:**
- Clear cookies
- Kiểm tra JWT_SECRET
- Kiểm tra token expiration