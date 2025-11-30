"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";
import type { UserRole } from "@/types/role-management";

interface ChangeRoleModalProps {
  onConfirm: (role: UserRole, reason?: string) => Promise<void>;
  currentRole: UserRole;
  userName: string;
  userId: string;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'text' | 'outline' | 'solid';
  className?: string;
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "READER", label: "Reader" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "ORGANIZATION_ADMIN", label: "Organization Admin" },
  { value: "BUSINESS_ADMIN", label: "Business Admin" },
  { value: "SYSTEM_ADMIN", label: "System Admin" },
];

export default function ChangeRoleModal({
  onConfirm,
  currentRole,
  userName,
  title,
  description,
  size = 'md',
  variant = 'outline',
  className = '',
}: ChangeRoleModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setSelectedRole(currentRole);
      setReason("");
    }
  }, [isModalOpen, currentRole]);

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const variantClasses = {
    text: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20',
    outline: 'text-blue-600 border border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20',
    solid: 'text-white bg-blue-600 hover:bg-blue-700',
  };

  const handleRoleClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isLoading) return;
    setIsModalOpen(false);
  };

  const handleConfirm = async () => {
    if (selectedRole === currentRole) {
      return;
    }
    try {
      setIsLoading(true);
      await onConfirm(selectedRole, reason || undefined);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Role change failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRoleLabel = ROLE_OPTIONS.find(r => r.value === currentRole)?.label || currentRole;
  const selectedRoleLabel = ROLE_OPTIONS.find(r => r.value === selectedRole)?.label || selectedRole;

  return (
    <>
      <button
        onClick={handleRoleClick}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        Change Role
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
                    selectedRole === "SYSTEM_ADMIN" || selectedRole === "BUSINESS_ADMIN"
                      ? "bg-red-100 dark:bg-red-900/20"
                      : "bg-blue-100 dark:bg-blue-900/20"
                  }`}>
                    <AlertCircle className={`w-5 h-5 ${
                      selectedRole === "SYSTEM_ADMIN" || selectedRole === "BUSINESS_ADMIN"
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {title || "Change User Role"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userName}
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
                  {description || `Change the role for "${userName}"`}
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Role
                  </label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                    {currentRoleLabel}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="newRole"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    placeholder="Enter reason for role change..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {selectedRole !== currentRole && (
                  <div className={`rounded-lg p-4 mb-6 border ${
                    selectedRole === "SYSTEM_ADMIN" || selectedRole === "BUSINESS_ADMIN"
                      ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                      : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                  }`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        selectedRole === "SYSTEM_ADMIN" || selectedRole === "BUSINESS_ADMIN"
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`} />
                      <div className="flex-1">
                        {selectedRole === "SYSTEM_ADMIN" || selectedRole === "BUSINESS_ADMIN" ? (
                          <>
                            <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                              ⚠️ High Privilege Role Warning
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                              You are about to assign a <strong>{selectedRoleLabel}</strong> role, which grants extensive system permissions including:
                            </p>
                            <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside mb-2 space-y-1">
                              {selectedRole === "SYSTEM_ADMIN" ? (
                                <>
                                  <li>Full system configuration access</li>
                                  <li>User role management</li>
                                  <li>System log access</li>
                                  <li>All administrative functions</li>
                                </>
                              ) : (
                                <>
                                  <li>Organization management</li>
                                  <li>Domain, Type, Tag management</li>
                                  <li>Document approval workflows</li>
                                  <li>Business-level administrative functions</li>
                                </>
                              )}
                            </ul>
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                              Please ensure this change is authorized and necessary.
                            </p>
                            <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                              Role Change: {currentRoleLabel} → {selectedRoleLabel}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Role Change Summary
                            </p>
                            <p className="text-sm mt-1 text-blue-600 dark:text-blue-300">
                              From: {currentRoleLabel} → To: {selectedRoleLabel}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                  disabled={isLoading || selectedRole === currentRole}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedRole === "SYSTEM_ADMIN" || selectedRole === "BUSINESS_ADMIN"
                      ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                      : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
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
                  {isLoading ? "Changing..." : "Change Role"}
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

