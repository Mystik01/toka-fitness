'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateSession, signOut } from '@/app/lib/auth';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export default function AlreadyLoggedIn() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await validateSession();
        setUser(userData.user);
      } catch (err) {
        // If validation fails, redirect to login
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, redirect to login
      router.push('/auth/login');
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="min-h-screen sm:min-h-0 w-full max-w-md bg-white sm:rounded-lg sm:shadow-md p-6 sm:p-8 flex flex-col justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-100 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="min-h-screen sm:min-h-0 w-full max-w-md bg-white sm:rounded-lg sm:shadow-md p-6 sm:p-8 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You are already logged in
          </h1>
          <p className="text-gray-600">
            Welcome back, <span className="font-medium text-gray-900">{user.email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoToDashboard}
            className="w-full py-3 px-4 rounded-lg text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Dashboard
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-3 px-4 rounded-lg text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>Last signed in:</p>
            <p className="font-medium text-gray-700">
              {user.last_sign_in_at 
                ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'First time login'
              }
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need to switch accounts?{' '}
            <button
              onClick={handleLogout}
              className="text-indigo-600 hover:text-indigo-500 underline"
            >
              Logout and sign in with different account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}