'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, updateMe } from '@/app/lib/User';

export default function OnboardingPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user already has display name, redirect if so
    const checkOnboarding = async () => {
      try {
        const user = await getMe();
        if (user.user_metadata?.display_name || user.user_metadata?.first_name) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      }
    };

    checkOnboarding();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateMe({
        first_name: firstName,
        last_name: lastName,
      });
      
      // Use hard redirect to ensure cookies are refreshed
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Failed to save your information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl mb-4">👋</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome!
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Let's get to know you better
        </p>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '0.5rem',
          color: '#991b1b',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pt-2">
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem',
          }}>
            First Name *
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="John"
            className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem',
          }}>
            Last Name *
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="Doe"
            className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="pt-2 sm:pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-4 px-4 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
