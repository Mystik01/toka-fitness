"use client";

import { FitnessClass, Difficulty } from '@/app/lib/types/class';
import { Calendar, Clock, MapPin, Users, Star, TrendingUp } from 'lucide-react';

// Database class type (from API)
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

interface AvailableClassCardProps {
  fitnessClass: FitnessClass | DatabaseClass;
  onJoin?: (classId: string) => void;
  onWaitlist?: (classId: string) => void;
  onViewDetails?: (classId: string) => void;
}

export default function AvailableClassCard({ 
  fitnessClass, 
  onJoin, 
  onWaitlist,
  onViewDetails 
}: AvailableClassCardProps) {
  // Normalize data from either type
  const isDbClass = 'class_name' in fitnessClass;
  
  const id = String(fitnessClass.id);
  const name = isDbClass ? fitnessClass.class_name : fitnessClass.name;
  const type = isDbClass ? fitnessClass.class_type : fitnessClass.type;
  const instructor = fitnessClass.instructor;
  const location = fitnessClass.location;
  const startTime = isDbClass ? new Date(fitnessClass.start) : new Date(fitnessClass.startTime);
  const capacity = isDbClass ? fitnessClass.max_participants : fitnessClass.capacity;
  const enrolled = isDbClass ? fitnessClass.participants.length : fitnessClass.enrolled;
  const difficulty: Difficulty = isDbClass ? 'intermediate' : fitnessClass.difficulty;
  const rating = isDbClass ? undefined : fitnessClass.rating;
  const reviewCount = isDbClass ? undefined : fitnessClass.reviewCount;
  const instructorImage = isDbClass ? '👤' : fitnessClass.instructorImage;
  const status = isDbClass 
    ? (enrolled >= capacity ? 'full' : 'available') 
    : fitnessClass.status;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const classDate = new Date(date);
    
    if (classDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (classDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return classDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getTypeEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      yoga: '🧘',
      hiit: '💪',
      spin: '🚴',
      pilates: '🧘‍♀️',
      boxing: '🥊',
      swimming: '🏊',
      dance: '💃',
      strength: '🏋️',
    };
    return emojis[type] || '🏃';
  };

  const getDifficultyColor = (diff: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[diff] || 'bg-gray-100 text-gray-800';
  };

  const spotsRemaining = capacity - enrolled;
  const spotsPercentage = (enrolled / capacity) * 100;
  const isFull = status === 'full';
  const isFillingFast = spotsPercentage > 75 && !isFull;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow relative overflow-hidden">
      {/* Popular/Filling Fast Badge */}
      {isFillingFast && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Filling Fast
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{getTypeEmoji(type)}</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
          {difficulty}
        </span>
      </div>

      {/* Class Name */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {name}
      </h3>

      {/* Time & Date */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="font-medium">{formatDate(startTime)}</span>
          <span className="mx-1">•</span>
          <Clock className="w-4 h-4 mr-1" />
          <span>{formatTime(startTime)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{location}</span>
        </div>
      </div>

      {/* Instructor & Rating */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="text-xl mr-2">{instructorImage}</span>
          <span className="text-sm text-gray-700">{instructor}</span>
        </div>
        {rating && (
          <div className="flex items-center text-sm">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
            <span className="font-medium">{rating}</span>
            <span className="text-gray-500 ml-1">({reviewCount})</span>
          </div>
        )}
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            {isFull ? 'Full' : `${spotsRemaining} spots left`}
          </span>
          <span className="text-gray-500">
            {enrolled}/{capacity}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isFull ? 'bg-gray-400' : 
              isFillingFast ? 'bg-orange-500' : 
              'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(spotsPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isFull ? (
          <>
            <button
              onClick={() => onWaitlist?.(id)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors"
            >
              Join Waitlist
            </button>
            <button
              onClick={() => onViewDetails?.(id)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Details
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onJoin?.(id)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Join Class
            </button>
            <button
              onClick={() => onViewDetails?.(id)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
            >
              Details
            </button>
          </>
        )}
      </div>
    </div>
  );
}
