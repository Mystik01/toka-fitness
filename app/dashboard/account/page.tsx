"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User as UserIcon, Mail, Calendar, Loader2, Edit3, Shield, CheckCircle2 } from 'lucide-react';
import { getMe, updateMe } from '@/app/lib/User';
import DeleteAccountButton from '@/app/ui/auth/DeleteAccount';

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    role?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
}

export default function AccountPage() {
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Display name editing state
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);

  const isSettingsActive = pathname === '/dashboard/settings';
  const isAccountActive = pathname === '/dashboard/account';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getMe();
        setUserData(data as UserData);
        setFirstNameInput(data.user_metadata?.first_name || '');
        setLastNameInput(data.user_metadata?.last_name || '');
        // Role now comes from API (user_roles table); fallback to metadata if absent
        const role = (data as any).role || data.user_metadata?.role;
        setIsStaff(role === 'staff' || role === 'admin');
      } catch (err: any) {
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveDisplayName = async () => {
    try {
      setIsSavingDisplayName(true);
      
      const updatedUser = await updateMe({ 
        first_name: firstNameInput,
        last_name: lastNameInput 
      });
      
      if (userData) {
        setUserData({ 
          ...userData, 
          displayName: updatedUser.displayName,
          user_metadata: updatedUser.user_metadata
        });
      }
      setIsEditingDisplayName(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update display name');
    } finally {
      setIsSavingDisplayName(false);
    }
  };

  const handleCancelDisplayName = () => {
    setFirstNameInput(userData?.user_metadata?.first_name || '');
    setLastNameInput(userData?.user_metadata?.last_name || '');
    setIsEditingDisplayName(false);
  };

  const startEditingDisplayName = () => {
    setIsEditingDisplayName(true);
    setTimeout(() => {
      const input = document.getElementById('firstNameInput');
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
            <Link
              href="/dashboard/settings"
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                isSettingsActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-5 h-5 mr-2" />
              General Settings
            </Link>
            <Link
              href="/dashboard/account"
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                isAccountActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="w-5 h-5 mr-2" />
              Account Settings
            </Link>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
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
            <div className="space-y-6">
              {/* Profile Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2 text-indigo-600" />
                    Profile Information
                  </h3>
                  {isStaff && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Staff account
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {/* Display Name */}
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    !userData.displayName && !isEditingDisplayName 
                      ? 'bg-yellow-50 border-yellow-200 border-dashed' 
                      : 'bg-gray-50 border-transparent'
                  }`}>
                    <div className="flex items-center">
                      <UserIcon className="w-5 h-5 text-gray-400 mr-3 self-start mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Display Name</p>
                        {isEditingDisplayName ? (
                          <div className="space-y-2 mt-1">
                            <div className="flex gap-2">
                              <input
                                id="firstNameInput"
                                type="text"
                                value={firstNameInput}
                                onChange={(e) => setFirstNameInput(e.target.value)}
                                placeholder="First name"
                                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isSavingDisplayName}
                              />
                              <input
                                type="text"
                                value={lastNameInput}
                                onChange={(e) => setLastNameInput(e.target.value)}
                                placeholder="Last name"
                                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isSavingDisplayName}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={handleCancelDisplayName}
                                disabled={isSavingDisplayName}
                                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveDisplayName}
                                disabled={isSavingDisplayName || (!firstNameInput.trim() && !lastNameInput.trim())}
                                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSavingDisplayName ? 'Saving...' : 'Save'}
                              </button>
                            </div>
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
                      alert('Delete account feature coming soon!');
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}