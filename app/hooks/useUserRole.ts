'use client';

import { useEffect, useState } from 'react';
import { getMe } from '@/app/lib/User';
import { UserRole, extractRoleFromMetadata } from '@/app/lib/roles';

/**
 * Hook to get the current user's role
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
        const userRole = extractRoleFromMetadata(user.user_metadata);
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
