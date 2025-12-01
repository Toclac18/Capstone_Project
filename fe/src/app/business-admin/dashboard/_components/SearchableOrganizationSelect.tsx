"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import type { Organization } from "@/app/business-admin/organization/api";

interface SearchableOrganizationSelectProps {
  organizations: Organization[];
  selectedOrgId: string | null;
  onSelect: (orgId: string | null) => void;
  loading?: boolean;
}

export function SearchableOrganizationSelect({
  organizations,
  selectedOrgId,
  onSelect,
  loading = false,
}: SearchableOrganizationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOrg = organizations.find((org) => 
    org.id === selectedOrgId || org.organizationId === selectedOrgId || org.userId === selectedOrgId
  );

  const filteredOrganizations = organizations.filter((org) =>
    org?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  );

  const handleSelect = (orgId: string) => {
    onSelect(orgId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchQuery("");
  };

  return (
    <div className="relative w-full max-w-sm" ref={dropdownRef} style={{ zIndex: 100 }}>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Organization
      </label>
      <div className="relative" style={{ zIndex: 100 }} ref={buttonRef}>
        <div
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
          className="flex cursor-pointer items-center justify-between rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-gray-900 focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 dark:border-strokedark dark:bg-boxdark dark:text-white"
        >
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="flex-1 truncate">
              {selectedOrg?.name || "Select an organization..."}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {selectedOrgId && (
              <button
                onClick={handleClear}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <div 
            className="fixed rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark"
            ref={dropdownRef}
            style={{ 
              zIndex: 9999,
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
          >
            <div className="p-2">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full rounded-lg border border-stroke bg-white px-10 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-strokedark dark:bg-boxdark dark:text-white"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div 
                className="overflow-y-auto overflow-x-hidden"
                style={{ 
                  maxHeight: '400px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 transparent',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
              >
                {loading ? (
                  <div className="py-4 text-center text-sm text-gray-500">
                    Loading...
                  </div>
                ) : filteredOrganizations.length === 0 ? (
                  <div className="py-4 text-center text-sm text-gray-500">
                    {searchQuery
                      ? "No organizations found"
                      : "No organizations available"}
                  </div>
                ) : (
                  <div className="space-y-1 pb-2">
                    {filteredOrganizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => handleSelect(org.organizationId || org.userId || org.id)}
                        className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          selectedOrgId === (org.organizationId || org.userId || org.id)
                            ? "bg-primary/10 text-primary"
                            : "text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="font-medium">{org?.name || "Unknown Organization"}</div>
                        {org?.status && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {org.status}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {organizations.length > 0 && !loading && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {organizations.length} organization(s) available
        </p>
      )}
    </div>
  );
}

