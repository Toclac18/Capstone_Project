# Frontend - Readee
Lưu ý: Khi tạo màn hình mới thì chỉ cần tạo thư mục mới ở trong app và file trong thư mục đấy có tên là page.tsx hoặc route.ts thì lúc đấy URL để truy cập trang đấy sẽ là route đến folder đấy từ app

## Cấu trúc thư mục
```
fe/
├── public/                 # Static assets
│   ├── file.svg           # File icon
│   └── globe.svg          # Logo và icon
├── src/
│   ├── app/               # App Router (Next.js 13+)
│   │   ├── dashboard/    
│   │   │   └── page.tsx
│   │   ├── layout.tsx     # Root layout với header/footer
│   │   └── page.tsx       # Trang chủ
│   ├── components/        # React components
│   │   ├── ConditionalLayout.tsx
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   ├── constant/          # Constants
│   │   └── message.ts
│   ├── hooks/             # Custom React hooks
│   │   └── useLocalStorage.ts
│   ├── services/          # API services
│   │   └── api.ts
│   └── utils/             # Utility functions
│       └── format.ts
├── .eslintrc.json         # ESLint configuration
├── middleware.ts          # Next.js middleware
├── next.config.mjs        # Next.js configuration
├── next-env.d.ts         # Next.js TypeScript definitions
├── package.json           # Dependencies và scripts
├── package-lock.json      # Lock file cho dependencies
├── README.md              # Documentation
└── tsconfig.json          # TypeScript configuration
```

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js: 22.19.0
- npm: >=10

### Cài đặt dependencies
```bash
npm install
```

### Scripts có sẵn
```bash
# Chạy development server
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