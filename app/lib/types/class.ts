// lib/types/class.ts

export type ClassStatus = 'enrolled' | 'available' | 'full' | 'waitlist' | 'past';

export type ClassType = 'yoga' | 'hiit' | 'spin' | 'pilates' | 'boxing' | 'swimming' | 'dance' | 'strength';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface FitnessClass {
  id: string;
  name: string;
  type: ClassType;
  instructor: string;
  instructorImage?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  capacity: number;
  enrolled: number;
  difficulty: Difficulty;
  location: string;
  description: string;
  equipment?: string[];
  rating?: number;
  reviewCount?: number;
  status: ClassStatus;
  userStatus?: 'enrolled' | 'waitlisted' | null;
}

export interface ClassFilters {
  search: string;
  type: ClassType | 'all';
  date: Date | null;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'all';
  difficulty: Difficulty | 'all';
  availability: 'all' | 'open' | 'filling' | 'waitlist';
}
