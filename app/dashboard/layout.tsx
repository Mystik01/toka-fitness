'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from "@/app/ui/dashboard/NavBar";
import { getUserData, signOut } from '@/app/lib/auth';
import StaffBadge from '@/app/ui/dashboard/StaffBadge';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  displayName?: string;
    role?: 'user' | 'staff' | 'admin';
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    role?: string;
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<'user' | 'staff' | 'admin'>('user');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Since middleware already protects this route, we just need to get user data once
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        setUser(userData);
          // Get role from API response
          const role = (userData as any).role || userData.user_metadata?.role || 'user';
          setUserRole(role);
        setLoading(false);
      } catch (err) {
        console.error('Failed to get user data:', err);
        // If we can't get user data, something is wrong
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); // Empty dependency array - only run once on mount

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, redirect to login
      router.push('/auth/login');
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
                            <StaffBadge role={userRole} size="sm" />
              <span className="text-sm text-gray-600">
                Welcome, {user?.user_metadata?.first_name || user?.email || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}