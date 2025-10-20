"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

interface DeleteConfirmationProps {
  onDelete: (id: string | number) => Promise<void>;
  itemId: string | number;
  itemName: string;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'text' | 'outline' | 'solid';
  className?: string;
}

export default function DeleteConfirmation({
  onDelete,
  itemId,
  itemName,
  title = "Confirm Delete",
  description = "Are you sure you want to delete this item?",
  size = 'md',
  variant = 'text',
  className = '',
}: DeleteConfirmationProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Button styles
  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const variantClasses = {
    text: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20',
    outline: 'text-red-600 border border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20',
    solid: 'text-white bg-red-600 hover:bg-red-700',
  };

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isLoading) return; // Prevent closing while loading
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsLoading(true);
      await onDelete(itemId);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Delete Button */}
      <button
        onClick={handleDeleteClick}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        {isLoading ? (
          <svg 
            className="w-4 h-4 animate-spin" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        {isLoading ? 'Deleting...' : 'Delete'}
      </button>

      {/* Delete Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md mx-4">
            <div className="bg-white dark:bg-gray-dark rounded-lg shadow-xl border border-stroke dark:border-dark-3">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-stroke dark:border-dark-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <svg 
                      className="w-5 h-5 text-red-600 dark:text-red-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {itemName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {description}
                </p>
                
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg 
                      className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        This action cannot be undone
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        Data will be permanently deleted from the system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-stroke dark:border-dark-3 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isLoading && (
                    <svg 
                      className="w-4 h-4 animate-spin" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {isLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
