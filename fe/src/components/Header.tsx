import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">My App</h1>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/auth/signIn" className="text-gray-600 hover:text-gray-900">Sign In</Link>
            <Link href="/auth/signUp" className="text-gray-600 hover:text-gray-900">Sign Up</Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
