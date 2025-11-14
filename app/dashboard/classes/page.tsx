"use client";

import styles from '@/app/ui/css/dashboard/classes/style.module.css';
import { useState } from 'react';
import { Search, Filter, Calendar, ChevronRight } from 'lucide-react';
import EnrolledClassCard from '@/app/components/classes/EnrolledClassCard';
import AvailableClassCard from '@/app/components/classes/AvailableClassCard';
import { getEnrolledClasses, getAvailableClasses } from '@/app/lib/mockData/classes';
import { FitnessClass, ClassType } from '@/app/lib/types/class';

export default function ClassesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ClassType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const enrolledClasses = getEnrolledClasses();
  const allAvailableClasses = getAvailableClasses();

  // Filter available classes
  const availableClasses = allAvailableClasses.filter(fitnessClass => {
    const matchesSearch = fitnessClass.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fitnessClass.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || fitnessClass.type === selectedType;
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
      {/* Header */}
      <div>
        <h1 className={styles.title}>Fitness Classes</h1>
        <p className={styles.subtitle}>
          Join classes, track your schedule, and reach your fitness goals
        </p>
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
