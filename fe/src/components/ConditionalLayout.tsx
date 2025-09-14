'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if current path is auth pages
  const isAuthPage = pathname?.startsWith('/auth');
  
  if (isAuthPage) {
    // For auth pages, just render children without Header/Footer
    return <>{children}</>;
  }
  
  // For other pages, render with Header and Footer
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
