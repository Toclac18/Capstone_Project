# My Next.js App

Các file sẽ được route tự động theo src/app, những file thuộc folder nào sẽ được router theo folder đấy và bắt buộc tên file trong folder đấy phải là page hoặc route

## Features

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Responsive Design** with mobile-first approach
- **Clean Architecture** with organized folder structure

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── auth/              # Authentication pages
│   │   ├── signIn/        # Sign in page
│   │   ├── signUp/        # Sign up page
│   │   └── layout.tsx     # Auth layout (MISSING)
│   ├── dashboard/         # Dashboard page
│   ├── layout.tsx         # Root layout with Header & Footer
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── Header.tsx         # Navigation header
│   └── Footer.tsx         # Site footer
├── hooks/                 # Custom React hooks
│   ├── useLocalStorage.ts # Local storage hook
│   └── useApi.ts          # Generic API hook
├── lib/                   # Utility libraries
│   ├── api.ts             # Axios configuration
│   ├── constants.ts       # API endpoints & constants
│   └── utils.ts           # Helper functions
├── services/              # API service layer
│   └── auth.ts            # Authentication service 
└── .env.local             # Environment variables
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Pages

- **Home** (`/`) - Welcome page with feature cards
- **Dashboard** (`/dashboard`) - Dashboard with stats cards
- **Sign In** (`/auth/signIn`) - User authentication
- **Sign Up** (`/auth/signUp`) - User registration

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Fonts**: Geist Sans & Geist Mono
- **Linting**: ESLint

## Development

This project is set up with:
- TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality
- Path aliases (`@/` for `src/`)

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com), which is optimized for Next.js applications.
