"use client";

import styles from '@/app/ui/css/dashboard/classes/style.module.css';
import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, ChevronRight, Plus, X, MapPin, Users as UsersIcon, Clock, Share } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import EnrolledClassCard from '@/app/components/classes/EnrolledClassCard';
import AvailableClassCard from '@/app/components/classes/AvailableClassCard';
import { FitnessClass, ClassType } from '@/app/lib/types/class';
import { useUserRole } from '@/app/hooks/useUserRole';
import { canUserPerformAction } from '@/app/lib/roles';
import { getApiUrl } from '@/app/lib/apiClient';

interface DatabaseClass {
  id: number;
  class_name: string;
  class_type: string;
  instructor: string;
  instructor_name?: string;
  start: string;
  end: string;
  location: string;
  max_participants: number;
  participants: string[];
  description?: string;
  created_at: string;
}

export default function ClassesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ClassType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dbClasses, setDbClasses] = useState<DatabaseClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const { role, loading: roleLoading } = useUserRole();
  const isStaff = role === 'staff' || role === 'admin';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track selection from URL using ?class=<id> to stay on this page
  useEffect(() => {
    const idFromQuery = searchParams.get('class');
    setSelectedClassId(idFromQuery);
  }, [searchParams]);

  // Fetch staff users to map instructor IDs to display names
  useEffect(() => {
    const fetchStaffUsers = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/staff-users`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.staff_users)) {
          const map: Record<string, string> = {};
          data.staff_users.forEach((u: any) => {
            if (u?.id) {
              map[u.id] = u.name || u.email || u.id;
            }
          });
          setStaffMap(map);
        }
      } catch (err) {
        console.warn('Failed to fetch staff users for display map', err);
      }
    };

    fetchStaffUsers();
  }, []);

  // Fetch classes from database
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await fetch(`${getApiUrl()}/api/classes`);
        const data = await response.json();
        
        if (response.ok) {
          // Ensure we only store valid class objects
          const classes = Array.isArray(data.classes) ? data.classes : [];
          const sanitized = classes.filter((item: any) => item && typeof item === 'object');
          setDbClasses(sanitized as DatabaseClass[]);
        } else {
          setClassesError(data.error || 'Failed to load classes');
          // Fall back to mock data if DB fetch fails
          console.warn('Failed to fetch from DB, using mock data');
        }
      } catch (err) {
        setClassesError('Network error loading classes');
        console.error('Error fetching classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  const enrolledClasses: FitnessClass[] = [];
  
  // Filter available classes (no mock fallback)
  const availableClasses = dbClasses
    .filter((fitnessClass) => fitnessClass && typeof fitnessClass === 'object')
    .filter((fitnessClass) => {
    const className = 'class_name' in fitnessClass ? (fitnessClass as DatabaseClass).class_name : (fitnessClass as FitnessClass).name;
    const classType = 'class_type' in fitnessClass ? (fitnessClass as DatabaseClass).class_type : (fitnessClass as FitnessClass).type;
    const instructor = 'instructor' in fitnessClass ? (fitnessClass as DatabaseClass).instructor : '';
    
    const matchesSearch = className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         instructor?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || classType === selectedType;
    return matchesSearch && matchesType;
  });

  const classTypes: Array<{ value: ClassType | 'all'; label: string; emoji: string }> = [
    { value: 'all', label: 'All Classes', emoji: '🏃' },
    { value: 'yoga', label: 'Yoga', emoji: '🧘' },
    { value: 'hiit', label: 'HIIT', emoji: '💪' },
    { value: 'spin', label: 'Spin', emoji: '🚴' },
    { value: 'pilates', label: 'Pilates', emoji: '🧘‍♀️' },
    { value: 'boxing', label: 'Boxing', emoji: '🥊' },
    { value: 'strength', label: 'Strength', emoji: '🏋️' },
    { value: 'dance', label: 'Dance', emoji: '💃' },
    { value: 'swimming', label: 'Swimming', emoji: '🏊' },
  ];

  const handleJoinClass = (classId: string) => {
    console.log('Joining class:', classId);
    // TODO: Implement API call to join class
    alert(`Joined class ${classId}! (This will be connected to the backend later)`);
  };

  const handleCancelClass = (classId: string) => {
    console.log('Canceling class:', classId);
    // TODO: Implement API call to cancel enrollment
    if (confirm('Are you sure you want to cancel this class?')) {
      alert(`Cancelled class ${classId}! (This will be connected to the backend later)`);
    }
  };

  const handleWaitlist = (classId: string) => {
    console.log('Joining waitlist:', classId);
    // TODO: Implement API call to join waitlist
    alert(`Joined waitlist for class ${classId}! (This will be connected to the backend later)`);
  };

  const buildShareUrl = (classId: string) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('class', classId);
    return url.toString();
  };

  const handleShare = async (classId: string) => {
    const shareUrl = buildShareUrl(classId);
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Fitness Class', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard');
      }
    } catch (err) {
      console.warn('Share failed', err);
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard');
      } catch (e) {
        alert('Could not share link. Please copy manually.');
      }
    }
  };

  const handleViewDetails = (classId: string) => {
    setSelectedClassId(classId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('class', classId);
    const query = params.toString();
    router.push(`${pathname}?${query}`);
  };

  const handleCloseDetails = () => {
    setSelectedClassId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('class');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const selectedClass = useMemo(() => {
    if (!selectedClassId) return null;
    const found = dbClasses.find((c) => String(c.id) === String(selectedClassId));
    if (!found) return null;
    return {
      ...found,
      instructor_name: staffMap[found.instructor] || found.instructor,
    } as DatabaseClass;
  }, [dbClasses, selectedClassId, staffMap]);

  return (
    <>
    <div className={styles.root}>
      {/* Header with Staff Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={styles.title}>Fitness Classes</h1>
          <p className={styles.subtitle}>
            Join classes, track your schedule, and reach your fitness goals
          </p>
        </div>
        
        {isStaff && !roleLoading && (
          <Link href="/dashboard/classes/manage">
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4338ca')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
            >
              <Plus className="w-4 h-4" />
              Add Class
            </button>
          </Link>
        )}
      </div>

      {/* My Upcoming Classes Section */}
      <div className={styles.gradientCard}>
        <div className={styles.flexBetween}>
          <div>
            <h2 className={styles.sectionTitle}>
              📅 My Upcoming Classes ({enrolledClasses.length})
            </h2>
            <p className={styles.smallMuted}>
              Your enrolled classes for this week
            </p>
          </div>
          <button className={styles.viewCalendar}>
            View Calendar
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {enrolledClasses.length === 0 ? (
          <div className={styles.emptyCenter}>
            <p className={styles.mutedText}>You haven't enrolled in any classes yet.</p>
            <p className={styles.smallMutedAlt}>Browse available classes below to get started!</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {enrolledClasses.map((fitnessClass) => (
              <EnrolledClassCard
                key={fitnessClass.id}
                fitnessClass={fitnessClass}
                onCancel={handleCancelClass}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Browse All Classes Section */}
      <div>
        <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>
          💡 Browse All Classes
        </h2>

        {/* Search and Filter Bar */}
        <div className={styles.toolbar}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search classes or instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.input}
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={styles.filterButton}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Class Type Filter Pills */}
        <div className={styles.pillsContainer}>
          {classTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`${styles.pill} ${selectedType === type.value ? styles.pillSelected : ''}`}
            >
              <span className={styles.pillEmoji}>{type.emoji}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className={styles.resultsRow}>
          <p className={styles.resultsText}>
            Showing {availableClasses.length} {availableClasses.length === 1 ? 'class' : 'classes'}
          </p>
        </div>

        {/* Available Classes Grid */}
        {availableClasses.length === 0 ? (
          <div className={styles.emptyResults}>
            <p className={styles.textGray500}>There are no classes right now. Check back later.</p>
            <p className={styles.smallMutedAlt}>We add new classes regularly.</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {availableClasses.map((fitnessClass) => (
              <AvailableClassCard
                key={fitnessClass.id}
                fitnessClass={{
                  ...fitnessClass,
                  instructor_name: staffMap[fitnessClass.instructor] || fitnessClass.instructor,
                } as DatabaseClass & { instructor_name: string }}
                onJoin={handleJoinClass}
                onWaitlist={handleWaitlist}
                onViewDetails={handleViewDetails}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Details Modal Overlay */}
      {selectedClass && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Class</p>
                <h3 className="text-xl font-semibold text-gray-900">{selectedClass.class_name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedClassId && handleShare(selectedClassId)}
                  className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                  aria-label="Share class"
                >
                  <Share className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCloseDetails}
                  className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedClass.start).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  <Clock className="w-4 h-4" />
                  {new Date(selectedClass.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700">
                  <MapPin className="w-4 h-4" />
                  {selectedClass.location}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Instructor</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedClass.instructor_name || selectedClass.instructor}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Capacity</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedClass.participants?.length || 0} / {selectedClass.max_participants}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Description</p>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {selectedClass.description?.trim() || 'No description provided yet.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <UsersIcon className="w-4 h-4 text-gray-600" />
                  Participants ({selectedClass.participants?.length || 0})
                </div>
                {selectedClass.participants && selectedClass.participants.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedClass.participants.map((p, idx) => (
                      <span
                        key={`${p}-${idx}`}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No participants yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
