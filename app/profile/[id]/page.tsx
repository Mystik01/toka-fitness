"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApiUrl } from '@/app/lib/apiClient';
import AvailableClassCard from '@/app/components/classes/AvailableClassCard';
import EnrolledClassCard from '@/app/components/classes/EnrolledClassCard';

interface ProfileOverview {
  profile: { id: string; display_name?: string; avatar_url?: string; is_private: boolean; role?: string };
  stats: { favorite_type?: string | null; total_hours: number; classes_joined: number };
  enrolled: { upcoming: any[]; past: any[] };
  hosted?: { upcoming: any[]; past: any[] };
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = String(params?.id || '');

  const [overview, setOverview] = useState<ProfileOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${getApiUrl()}/api/profiles/${encodeURIComponent(userId)}/overview`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load profile');
        } else {
          setOverview(data);
        }
      } catch (e: any) {
        setError(e.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const title = useMemo(() => {
    if (!overview) return 'Profile';
    return overview.profile.display_name || 'Profile';
  }, [overview]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading profile…</div>;
  }
  if (error) {
    return <div style={{ padding: '2rem', color: '#b91c1c' }}>{error}</div>;
  }
  if (!overview) {
    return <div style={{ padding: '2rem' }}>No data.</div>;
  }

  const isInstructor = overview.profile.role === 'staff' || overview.profile.role === 'admin';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ width: 64, height: 64, background: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          {overview.profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={overview.profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{title}</h1>
          <p style={{ color: '#4b5563' }}>{isInstructor ? 'Instructor' : 'Member'}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem' }}>
          <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Total Hours</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{overview.stats.total_hours}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem' }}>
          <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Classes Joined</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{overview.stats.classes_joined}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem' }}>
          <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>Favorite Type</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{overview.stats.favorite_type || '—'}</div>
        </div>
      </div>

      {/* Enrolled Upcoming */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Upcoming Participation</h2>
        {overview.enrolled.upcoming.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No upcoming classes.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {overview.enrolled.upcoming.map((c: any) => (
              <EnrolledClassCard key={c.id} fitnessClass={c as any} onViewDetails={(id) => {}} />
            ))}
          </div>
        )}
      </section>

      {/* Enrolled Past */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Past Participation</h2>
        {overview.enrolled.past.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No past classes.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {overview.enrolled.past.map((c: any) => (
              <EnrolledClassCard key={c.id} fitnessClass={c as any} onViewDetails={(id) => {}} />
            ))}
          </div>
        )}
      </section>

      {/* Instructor Hosted */}
      {isInstructor && overview.hosted && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Upcoming Classes to Join</h2>
          {overview.hosted.upcoming.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No upcoming hosted classes.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {overview.hosted.upcoming.map((c: any) => (
                <AvailableClassCard key={c.id} fitnessClass={{ ...(c as any), instructor_name: overview.profile.display_name } as any} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
