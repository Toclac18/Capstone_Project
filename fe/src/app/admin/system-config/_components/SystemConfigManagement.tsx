"use client";

import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import { Search } from "lucide-react";

interface SystemConfig {
  id: string;
  configKey: string;
  configValue: string;
  description?: string;
  configType: string; // STRING, NUMBER, BOOLEAN, JSON
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

export function SystemConfigManagement() {
  const { showToast } = useToast();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadConfigs();
  }, []);

  // Filter and sort configs
  const filteredAndSortedConfigs = useMemo(() => {
    let filtered = configs;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = configs.filter(
        (config) =>
          config.configKey.toLowerCase().includes(query) ||
          config.description?.toLowerCase().includes(query) ||
          config.configValue.toLowerCase().includes(query) ||
          config.configType.toLowerCase().includes(query)
      );
    }

    // Sort by updatedAt (newest first) by default
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA; // Descending (newest first)
    });
  }, [configs, searchQuery]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/system-admin/configs", {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to load configs");
      }
      
      const data = await response.json();
      // Handle both wrapped and direct array responses
      const configsArray = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setConfigs(configsArray);
    } catch (error: any) {
      console.error("Error loading configs:", error);
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to load system configurations",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: SystemConfig) => {
    if (!config.isEditable) return;
    setEditingKey(config.configKey);
    setEditValue(config.configValue);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/system-admin/configs/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ configValue: editValue }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update config");
      }

      showToast({
        type: "success",
        title: "Success",
        message: "Configuration updated successfully",
      });

      setEditingKey(null);
      setEditValue("");
      loadConfigs();
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to update configuration",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInputType = (configType: string): string => {
    switch (configType.toUpperCase()) {
      case "NUMBER":
      case "INTEGER":
        return "number";
      case "BOOLEAN":
        return "checkbox";
      default:
        return "text";
    }
  };

  const renderInput = (config: SystemConfig) => {
    if (editingKey !== config.configKey) {
      return (
        <span className="text-gray-700 dark:text-gray-300">
          {config.configValue}
        </span>
      );
    }

    if (config.configType.toUpperCase() === "BOOLEAN") {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
          disabled={saving}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    return (
      <input
        type={getInputType(config.configType)}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
        disabled={saving}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          System Configuration
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage system-wide settings and configurations
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by key, description, value, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Results count */}
      {searchQuery && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Found {filteredAndSortedConfigs.length} of {configs.length} configurations
        </div>
      )}

      {/* Config Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {filteredAndSortedConfigs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery ? "No configurations match your search" : "No configurations found"}
                </td>
              </tr>
            ) : (
              filteredAndSortedConfigs.map((config) => (
                <tr key={config.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {config.configKey}
                  </td>
                  <td className="px-6 py-4 text-sm">{renderInput(config)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {config.description || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {config.configType}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    {editingKey === config.configKey ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSave(config.configKey)}
                          disabled={saving}
                          className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(config)}
                        disabled={!config.isEditable}
                        className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {config.isEditable ? "Edit" : "Read-only"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

