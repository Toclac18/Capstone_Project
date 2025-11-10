"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";

interface StatusConfirmationProps {
  onConfirm: (status: "ACTIVE" | "INACTIVE") => Promise<void>;
  currentStatus: "ACTIVE" | "INACTIVE";
  itemName: string;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'text' | 'outline' | 'solid';
  className?: string;
}

export default function StatusConfirmation({
  onConfirm,
  currentStatus,
  itemName,
  title,
  description,
  size = 'md',
  variant = 'outline',
  className = '',
}: StatusConfirmationProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const newStatus: "ACTIVE" | "INACTIVE" = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  const statusLabel = newStatus === "ACTIVE" ? "Active" : "Inactive";

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const variantClasses = {
    text: currentStatus === "ACTIVE" 
      ? 'text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20'
      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20',
    outline: newStatus === "ACTIVE"
      ? 'text-green-600 border border-green-300 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900/20'
      : 'text-orange-600 border border-orange-300 hover:bg-orange-50 dark:border-orange-700 dark:hover:bg-orange-900/20',
    solid: newStatus === "ACTIVE"
      ? 'text-white bg-green-600 hover:bg-green-700'
      : 'text-white bg-orange-600 hover:bg-orange-700',
  };

  const handleStatusClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isLoading) return;
    setIsModalOpen(false);
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm(newStatus);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Status update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleStatusClick}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        {statusLabel}
      </button>

      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          <div className="relative z-[100000] w-full max-w-md mx-4" style={{ zIndex: 100000 }}>
            <div className="bg-white dark:bg-gray-dark rounded-lg shadow-xl border border-stroke dark:border-dark-3">
              <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-dark-3">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    newStatus === "ACTIVE" 
                      ? "bg-green-100 dark:bg-green-900/20" 
                      : "bg-orange-100 dark:bg-orange-900/20"
                  }`}>
                    <AlertCircle className={`w-5 h-5 ${
                      newStatus === "ACTIVE" 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-orange-600 dark:text-orange-400"
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {title || `Confirm ${statusLabel} Status`}
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

              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {description || `Are you sure you want to set "${itemName}" to ${statusLabel}?`}
                </p>
                
                <div className={`rounded-lg p-4 mb-6 ${
                  newStatus === "ACTIVE"
                    ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
                    : "bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800"
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle 
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        newStatus === "ACTIVE"
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`} 
                    />
                    <div>
                      <p className={`text-sm font-medium ${
                        newStatus === "ACTIVE"
                          ? "text-green-800 dark:text-green-200"
                          : "text-orange-800 dark:text-orange-200"
                      }`}>
                        Current status: {currentStatus}
                      </p>
                      <p className={`text-sm mt-1 ${
                        newStatus === "ACTIVE"
                          ? "text-green-600 dark:text-green-300"
                          : "text-orange-600 dark:text-orange-300"
                      }`}>
                        New status: {newStatus}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-stroke dark:border-dark-3 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                    newStatus === "ACTIVE"
                      ? "bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                      : "bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400"
                  }`}
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
                  {isLoading ? "Updating..." : `Set to ${statusLabel}`}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


