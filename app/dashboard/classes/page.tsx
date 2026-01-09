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
  id: string;
  class_name: string;
  class_type: string;
  instructor: string;
  instructor_name?: string;
  start: string;
  end: string;
  location: string;
  max_participants: number;
  enrolled_count?: number;
  participants?: string[];
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
  const [enrolledClassIds, setEnrolledClassIds] = useState<Set<string>>(new Set());
  const [enrolledDbClasses, setEnrolledDbClasses] = useState<DatabaseClass[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [classEnrollments, setClassEnrollments] = useState<any[]>([]);
  const [loadingClassEnrollments, setLoadingClassEnrollments] = useState(false);

  const { role, loading: roleLoading } = useUserRole();
  const isStaff = role === 'staff' || role === 'admin';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fetch enrollments for selected class
  useEffect(() => {
    if (!selectedClassId) {
      setClassEnrollments([]);
      return;
    }

    const fetchEnrollments = async () => {
      try {
        setLoadingClassEnrollments(true);
        const response = await fetch(`${getApiUrl()}/api/classes/${selectedClassId}/enrollments`);
        const data = await response.json();
        
        if (response.ok && Array.isArray(data.enrollments)) {
          setClassEnrollments(data.enrollments);
        }
      } catch (err) {
        console.error('Error fetching enrollments:', err);
      } finally {
        setLoadingClassEnrollments(false);
      }
    };

    fetchEnrollments();
  }, [selectedClassId]);

  // Fetch instructor display names from public profiles
  useEffect(() => {
    const fetchInstructorProfiles = async () => {
      try {
        const ids = Array.from(new Set(dbClasses.map((c) => String(c.instructor)).filter(Boolean)));
        if (ids.length === 0) return;
        const response = await fetch(`${getApiUrl()}/api/profiles?ids=${encodeURIComponent(ids.join(','))}`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.profiles)) {
          const map: Record<string, string> = {};
          data.profiles.forEach((p: any) => {
            if (p?.id) {
              map[p.id] = p.display_name || p.id;
            }
          });
          setStaffMap(map);
        }
      } catch (err) {
        console.warn('Failed to fetch instructor profiles', err);
      }
    };
    fetchInstructorProfiles();
  }, [dbClasses]);

  // Fetch user's enrolled classes
  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoadingEnrollments(true);
        const response = await fetch(`${getApiUrl()}/api/my-enrollments`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok && Array.isArray(data.enrolled_classes)) {
          setEnrolledDbClasses(data.enrolled_classes);
          const ids = new Set<string>(data.enrolled_classes.map((c: any) => String(c.id)));
          setEnrolledClassIds(ids);
        }
      } catch (err) {
        console.error('Error fetching enrollments:', err);
      } finally {
        setLoadingEnrollments(false);
      }
    };

    fetchEnrollments();
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

  // Filter available classes to exclude enrolled ones
  const availableClasses = dbClasses
    .filter((fitnessClass) => fitnessClass && typeof fitnessClass === 'object')
    .filter((fitnessClass) => !enrolledClassIds.has(String(fitnessClass.id)))
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

  const handleJoinClass = async (classId: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/classes/${classId}/enroll`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Move class from available to enrolled
        const enrolledClass = dbClasses.find(c => String(c.id) === classId);
        if (enrolledClass) {
          setEnrolledDbClasses(prev => [...prev, enrolledClass]);
          setEnrolledClassIds(prev => new Set([...Array.from(prev), String(enrolledClass.id)]));
        }
        alert('Successfully enrolled in class!');
      } else {
        alert(data.error || 'Failed to enroll in class');
      }
    } catch (err) {
      console.error('Error enrolling:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleCancelClass = async (classId: string) => {
    if (!confirm('Are you sure you want to cancel this class?')) {
      return;
    }
    
    try {
      const response = await fetch(`${getApiUrl()}/api/classes/${classId}/enroll`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Move class from enrolled to available
        setEnrolledDbClasses(prev => prev.filter(c => String(c.id) !== classId));
        setEnrolledClassIds(prev => {
          const next = new Set(prev);
          next.delete(String(classId));
          return next;
        });
        alert('Successfully unenrolled from class');
      } else {
        alert(data.error || 'Failed to unenroll from class');
      }
    } catch (err) {
      console.error('Error unenrolling:', err);
      alert('Network error. Please try again.');
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

  const handleRemoveUserFromClass = async (classId: string, userId: string) => {
    if (!confirm('Remove this user from the class?')) return;
    
    try {
      const response = await fetch(`${getApiUrl()}/api/classes/${classId}/enrollments/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Refresh the enrollments list
        setClassEnrollments(prev => prev.filter(e => e.user_id !== userId));
        alert('User removed from class');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove user');
      }
    } catch (err) {
      console.error('Error removing user:', err);
      alert('Network error');
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
              📅 My Upcoming Classes ({enrolledDbClasses.length})
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

        {loadingEnrollments ? (
          <div className={styles.emptyCenter}>
            <p className={styles.mutedText}>Loading your classes...</p>
          </div>
        ) : enrolledDbClasses.length === 0 ? (
          <div className={styles.emptyCenter}>
            <p className={styles.mutedText}>You haven't enrolled in any classes yet.</p>
            <p className={styles.smallMutedAlt}>Browse available classes below to get started!</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {enrolledDbClasses.map((dbClass) => (
              <EnrolledClassCard
                key={dbClass.id}
                fitnessClass={{
                  ...dbClass,
                  instructor_name: staffMap[dbClass.instructor] || dbClass.instructor,
                } as any}
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
                    {classEnrollments.length || selectedClass.enrolled_count || 0} / {selectedClass.max_participants}
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
                  Participants ({classEnrollments.length})
                </div>
                {loadingClassEnrollments ? (
                  <p className="text-sm text-gray-600">Loading participants...</p>
                ) : classEnrollments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {classEnrollments.map((enrollment) => (
                      <div key={enrollment.user_id} className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{enrollment.display_name || 'User'}</p>
                          {enrollment.email && <p className="text-xs text-gray-600">{enrollment.email}</p>}
                        </div>
                        {isStaff && !roleLoading && (
                          <button
                            onClick={() => selectedClassId && handleRemoveUserFromClass(selectedClassId, enrollment.user_id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
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
