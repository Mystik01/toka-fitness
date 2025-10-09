"use client";

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fitness Classes</h1>
        <p className="mt-2 text-gray-600">
          Join classes, track your schedule, and reach your fitness goals
        </p>
      </div>

      {/* My Upcoming Classes Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              📅 My Upcoming Classes ({enrolledClasses.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Your enrolled classes for this week
            </p>
          </div>
          <button className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View Calendar
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {enrolledClasses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't enrolled in any classes yet.</p>
            <p className="text-sm text-gray-400 mt-1">Browse available classes below to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div className="border-t border-gray-200" />

      {/* Browse All Classes Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          💡 Browse All Classes
        </h2>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search classes or instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Class Type Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {classTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedType === type.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1.5">{type.emoji}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Showing {availableClasses.length} {availableClasses.length === 1 ? 'class' : 'classes'}
          </p>
        </div>

        {/* Available Classes Grid */}
        {availableClasses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No classes found matching your filters.</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
