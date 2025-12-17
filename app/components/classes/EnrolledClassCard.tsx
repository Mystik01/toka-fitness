"use client";

import { FitnessClass } from '@/app/lib/types/class';
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react';

// Database class type (from API)
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
}

interface EnrolledClassCardProps {
  fitnessClass: FitnessClass | DatabaseClass;
  onCancel?: (classId: string) => void;
  onViewDetails?: (classId: string) => void;
}

export default function EnrolledClassCard({ 
  fitnessClass, 
  onCancel, 
  onViewDetails 
}: EnrolledClassCardProps) {
  // Normalize data from either type
  const isDbClass = 'class_name' in fitnessClass;
  
  const id = String(fitnessClass.id);
  const name = isDbClass ? fitnessClass.class_name : fitnessClass.name;
  const type = isDbClass ? fitnessClass.class_type : fitnessClass.type;
  const instructor = isDbClass
    ? (fitnessClass as any).instructor_name || fitnessClass.instructor
    : fitnessClass.instructor;
  const location = fitnessClass.location;
  const startTime = isDbClass ? new Date(fitnessClass.start) : new Date(fitnessClass.startTime);
  const instructorImage = isDbClass ? '👤' : fitnessClass.instructorImage;

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

  const getTypeEmoji = (classType: string) => {
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
    return emojis[classType] || '🏃';
  };

  return (
    <div className="bg-white rounded-lg border-2 border-green-500 p-4 hover:shadow-lg transition-shadow">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Enrolled
        </span>
        <span className="text-2xl">{getTypeEmoji(type)}</span>
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

      {/* Instructor */}
      <div className="flex items-center mb-4">
        <span className="text-xl mr-2">{instructorImage}</span>
        <span className="text-sm text-gray-700">{instructor}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails?.(id)}
          className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onCancel?.(id)}
          className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors flex items-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
