"use client";
import { useState, useEffect } from "react";
import { settingsApi } from "../api";

export function Settings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsApi.updateSettings(settings);
      setIsDirty(false);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your business admin settings and preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-gray-dark rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            General Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={settings.businessName || ''}
                onChange={(e) => handleChange('businessName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Enter business name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Notifications
              </label>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={settings.emailNotifications !== false}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                  className="rounded mr-2" 
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Receive email notifications
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-dark rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Security Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Two-Factor Authentication
              </label>
              <button 
                onClick={() => alert('2FA feature coming soon')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                Enable 2FA
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <button 
                onClick={() => alert('Change password feature coming soon')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-dark rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notification Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                User Registration Notifications
              </span>
              <input 
                type="checkbox" 
                checked={settings.userRegistrationNotifications !== false}
                onChange={(e) => handleChange('userRegistrationNotifications', e.target.checked)}
                className="rounded" 
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                System Alerts
              </span>
              <input 
                type="checkbox" 
                checked={settings.systemAlerts !== false}
                onChange={(e) => handleChange('systemAlerts', e.target.checked)}
                className="rounded" 
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Weekly Reports
              </span>
              <input 
                type="checkbox" 
                checked={settings.weeklyReports || false}
                onChange={(e) => handleChange('weeklyReports', e.target.checked)}
                className="rounded" 
              />
            </div>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white dark:bg-gray-dark rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            API Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={settings.apiKey || 'sk-...abc123'}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(settings.apiKey || 'sk-...abc123');
                    alert('API Key copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-r-lg transition"
                >
                  Copy
                </button>
              </div>
            </div>
            <button 
              onClick={() => alert('Regenerate API key feature coming soon')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              Regenerate API Key
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleSave}
          disabled={loading || !isDirty}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </>
  );
}

