"use client";

import { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Globe, User as UserIcon, Mail, Calendar, Loader2, Edit3, Check, X } from 'lucide-react';
import { getMe } from '@/app/lib/User';
import DeleteAccountButton from '@/app/ui/auth/DeleteAccount';
type Tab = 'general' | 'account';

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Display name editing state
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);

  // General Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getMe();
        setUserData(data as UserData);
        setDisplayNameInput(data.displayName || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'account') {
      fetchUserData();
    }
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveGeneral = () => {
    // TODO: Implement save to backend
    alert('General settings saved! (This will be connected to backend later)');
  };

  const handleSaveDisplayName = async () => {
    try {
      setIsSavingDisplayName(true);
      // TODO: Implement API call to update display name
      // await updateMe({ displayName: displayNameInput });
      
      // For now, just update local state
      if (userData) {
        setUserData({ ...userData, displayName: displayNameInput });
      }
      setIsEditingDisplayName(false);
      
      // TODO: Remove this alert when backend is connected
      alert('Display name updated! (This will be connected to backend later)');
    } catch (err) {
      alert('Failed to update display name');
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  const handleCancelDisplayName = () => {
    setDisplayNameInput(userData?.displayName || '');
    setIsEditingDisplayName(false);
  };

  const startEditingDisplayName = () => {
    setIsEditingDisplayName(true);
    // Auto-focus when there's no display name set
    setTimeout(() => {
      const input = document.getElementById('displayNameInput');
      input?.focus();
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-5 h-5 mr-2" />
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'account'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="w-5 h-5 mr-2" />
              Account Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Notifications Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <Bell className="w-5 h-5 mr-2 text-indigo-600" />
                  Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email updates about your classes and activity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-500">Get push notifications on your devices</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Digest</p>
                      <p className="text-sm text-gray-500">Get a weekly summary of your fitness progress</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weeklyDigest}
                        onChange={(e) => setWeeklyDigest(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Appearance Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <Palette className="w-5 h-5 mr-2 text-indigo-600" />
                  Appearance
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['light', 'dark', 'auto'] as const).map((themeOption) => (
                        <button
                          key={themeOption}
                          onClick={() => setTheme(themeOption)}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            theme === themeOption
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium capitalize">{themeOption}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Language Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <Globe className="w-5 h-5 mr-2 text-indigo-600" />
                  Language & Region
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleSaveGeneral}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading account information...</span>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">Error: {error}</p>
                </div>
              ) : userData ? (
                <>
                  {/* Profile Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                      <UserIcon className="w-5 h-5 mr-2 text-indigo-600" />
                      Profile Information
                    </h3>
                    <div className="space-y-4">
                      {/* Display Name */}
                      <div className={`p-4 rounded-lg border-2 transition-all ${
                        !userData.displayName && !isEditingDisplayName 
                          ? 'bg-yellow-50 border-yellow-200 border-dashed' 
                          : 'bg-gray-50 border-transparent'
                      }`}>
                        <div className="flex items-center">
                          <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Display Name</p>
                            {isEditingDisplayName ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  id="displayNameInput"
                                  type="text"
                                  value={displayNameInput}
                                  onChange={(e) => setDisplayNameInput(e.target.value)}
                                  placeholder="Enter your display name"
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={isSavingDisplayName}
                                />
                                <button
                                  onClick={handleSaveDisplayName}
                                  disabled={isSavingDisplayName || !displayNameInput.trim()}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelDisplayName}
                                  disabled={isSavingDisplayName}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  {userData.displayName ? (
                                    <p className="font-medium text-gray-900">{userData.displayName}</p>
                                  ) : (
                                    <div>
                                      <p className="font-medium text-yellow-700">Not set</p>
                                      <p className="text-xs text-yellow-600 mt-1">
                                        👋 Add a display name to personalize your profile
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={startEditingDisplayName}
                                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Edit display name"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p className="font-medium text-gray-900">{userData.email}</p>
                        </div>
                      </div>

                      {/* User ID */}
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">User ID</p>
                          <p className="font-medium text-gray-900 font-mono text-sm">{userData.id}</p>
                        </div>
                      </div>

                      {/* Member Since */}
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Member Since</p>
                          <p className="font-medium text-gray-900">{formatDate(userData.created_at)}</p>
                        </div>
                      </div>

                      {/* Last Sign In */}
                      {userData.last_sign_in_at && (
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Last Sign In</p>
                            <p className="font-medium text-gray-900">{formatDate(userData.last_sign_in_at)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Account Actions
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => alert('Change email feature coming soon!')}
                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <p className="font-medium text-gray-900">Change Email</p>
                        <p className="text-sm text-gray-500">Update your email address</p>
                      </button>

                      <button
                        onClick={() => alert('Change password feature coming soon!')}
                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <p className="font-medium text-gray-900">Change Password</p>
                        <p className="text-sm text-gray-500">Update your password for security</p>
                      </button>

                      <DeleteAccountButton
                        className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                        onConfirm={() => {
                          // TODO: replace with real API call
                          alert('Delete account feature coming soon!');
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
