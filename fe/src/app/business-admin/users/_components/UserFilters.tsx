"use client";
import React, { useState } from 'react';
import { UserQueryParams } from '@/types/user';

interface UserFiltersProps {
  onFiltersChange: (filters: UserQueryParams) => void;
  loading?: boolean;
}

export function UserFilters({ onFiltersChange, loading = false }: UserFiltersProps) {
  const [filters, setFilters] = useState<UserQueryParams>({
    search: '',
    role: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    dateFrom: '',
    dateTo: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof UserQueryParams, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 }; // Reset to page 1 when filters change
    setFilters(newFilters);
  };

  const handleSearch = () => {
    const searchFilters: UserQueryParams = { ...filters, page: 1 };
    onFiltersChange(searchFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: UserQueryParams = {
      search: '',
      role: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc' as 'asc' | 'desc',
      dateFrom: '',
      dateTo: '',
      page: 1
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'READER', label: 'Reader' },
    { value: 'REVIEWER', label: 'Reviewer' },
    { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'DELETED', label: 'Deleted' },
    { value: 'DEACTIVE', label: 'Deactive' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
    { value: 'status', label: 'Status' },
    { value: 'createdAt', label: 'Created Date' }
  ];

  const sortOrderOptions = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' }
  ];

  return (
    <div className="bg-white dark:bg-gray-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              disabled={loading}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </button>
          
          <button
            onClick={handleSearch}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 transition disabled:opacity-50"
            disabled={loading}
          >
            Search
          </button>

          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            disabled={loading}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            disabled={loading}
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            disabled={loading}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            disabled={loading}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
            disabled={loading}
          >
            {sortOrderOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Date Range Filter</h3>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                disabled={loading}
              />
            </div>
            
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(filters.search || filters.role || filters.status || filters.dateFrom || filters.dateTo) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Search: {filters.search}
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.role && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Role: {roleOptions.find(r => r.value === filters.role)?.label}
                <button
                  onClick={() => handleFilterChange('role', '')}
                  className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Date: {filters.dateFrom || 'Start'} - {filters.dateTo || 'End'}
                <button
                  onClick={() => {
                    handleFilterChange('dateFrom', '');
                    handleFilterChange('dateTo', '');
                  }}
                  className="ml-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


