'use client';

import { useEffect, useState } from 'react';
import { getMe } from '@/app/lib/User';
import { UserRole } from '@/app/lib/roles';

/**
 * Hook to get the current user's role
 * Role is now fetched from secure user_roles DB table via API
 */
export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setLoading(true);
        const user = await getMe();
        // Role now comes directly from API (fetched from secure DB table)
        const userRole = user.role || 'user';
        setRole(userRole);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user role');
        setRole('user'); // default to user role on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { role, loading, error };
}
