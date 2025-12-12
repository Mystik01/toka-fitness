"use client";

import styles from '@/app/ui/css/dashboard/classes/style.module.css';
import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import EnrolledClassCard from '@/app/components/classes/EnrolledClassCard';
import AvailableClassCard from '@/app/components/classes/AvailableClassCard';
import { getEnrolledClasses, getAvailableClasses } from '@/app/lib/mockData/classes';
import { FitnessClass, ClassType } from '@/app/lib/types/class';
import { useUserRole } from '@/app/hooks/useUserRole';
import { canUserPerformAction } from '@/app/lib/roles';
import { getApiUrl } from '@/app/lib/apiClient';

interface DatabaseClass {
  id: number;
  class_name: string;
  class_type: string;
  instructor: string;
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

  const { role, loading: roleLoading } = useUserRole();
  const isStaff = role === 'staff' || role === 'admin';

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

  const enrolledClasses = getEnrolledClasses();
  
  // Get available classes - normalize to a single array type
  const allAvailableClasses: (DatabaseClass | FitnessClass)[] = dbClasses.length > 0 
    ? dbClasses 
    : getAvailableClasses();

  // Filter available classes
  const availableClasses = allAvailableClasses
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

  const handleViewDetails = (classId: string) => {
    console.log('Viewing details for class:', classId);
    // TODO: Navigate to class details page
    alert(`View details for class ${classId}! (Details page coming soon)`);
  };

  return (
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
            <p className={styles.textGray500}>No classes found matching your filters.</p>
            <p className={styles.smallMutedAlt}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {availableClasses.map((fitnessClass) => (
              <AvailableClassCard
                key={fitnessClass.id}
                fitnessClass={fitnessClass}
                onJoin={handleJoinClass}
                onWaitlist={handleWaitlist}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
