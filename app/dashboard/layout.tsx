'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from "@/app/ui/dashboard/NavBar";
import { getUserData, signOut } from '@/app/lib/auth';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Since middleware already protects this route, we just need to get user data once
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        setUser(userData);
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

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [children]);

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
      {/* Navigation Component */}
      <NavBar 
        user={user}
        onLogout={handleLogout}
        isOpen={mobileMenuOpen}
        onToggle={toggleMobileMenu}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}