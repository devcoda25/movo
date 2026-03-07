// User Types
export type UserType = 'admin' | 'escort' | 'client';

// Gender Types
export type Gender = 'male' | 'female' | 'transgender_male' | 'transgender_female' | 'non_binary' | 'other' | 'prefer_not_to_say';

// User Interface
export interface User {
  id: string;
  email: string | null;
  phone: string;
  fullName: string;
  dateOfBirth: string; // ISO date string (YYYY-MM-DD)
  userType: UserType;
  gender: Gender;
  location: string;
  profilePhoto: string;
  bio: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Service Interface
export interface Service {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

// Escort Profile Interface
export interface EscortProfile {
  id: string;
  userId: string;
  services: string[];
  photos: string[];
  videos: string[];
  hourlyRate: number;
  availability: EscortAvailability;
  rating: number;
  totalBookings: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Escort Availability
export interface EscortAvailability {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startTime: string;
  endTime: string;
}

// Booking Status
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

// Booking Interface
export interface Booking {
  id: string;
  clientId: string;
  escortId: string;
  serviceId: string;
  status: BookingStatus;
  date: Date;
  time: string;
  location: string;
  notes: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'message' | 'system' | 'promotion';
  isRead: boolean;
  createdAt: Date;
}

// Uganda Locations
export const UGANDA_LOCATIONS = [
  'Kampala',
  'Entebbe',
  'Mbarara',
  'Jinja',
  'Gulu',
  'Lira',
  'Masaka',
  'Kasese',
  'Kabale',
  'Mukono',
  'Nansana',
  'Kira',
  'Soroti',
  'Tororo',
  'Busia',
  'Arua',
  'Fort Portal',
  'Ibanda',
  'Kamwenge',
  'Kiryandongo',
  'Luweero',
  'Rakai',
  'Sembabule',
  'Wakiso',
] as const;

export type UgandaLocation = (typeof UGANDA_LOCATIONS)[number];

// Default Services (will be created by admin)
export const DEFAULT_SERVICES = [
  { name: 'Anal Sex', description: 'Anal sexual services' },
  { name: 'BDSM', description: 'Bondage, Discipline, Sadism, Masochism' },
  { name: 'CIM - Come In Mouth', description: 'Oral sex with ejaculation in mouth' },
  { name: 'COB - Come On Body', description: 'Oral sex with ejaculation on body' },
  { name: 'Couples', description: 'Services for couples' },
  { name: 'Deep Throat', description: 'Deep throat oral sex' },
  { name: 'Dinner Date', description: 'Companionship for dinner dates' },
  { name: 'Face Sitting', description: 'Face sitting service' },
  { name: 'Fisting', description: 'Fisting service' },
  { name: 'Foot Fetish', description: 'Foot fetish services' },
  { name: 'French Kissing', description: 'French kissing service' },
  { name: 'Handjob', description: 'Handjob service' },
  { name: 'Lesbian Shows', description: 'Lesbian performance shows' },
  { name: 'Live Shows', description: 'Live adult shows' },
  { name: 'Stripping', description: 'Striptease performance' },
  { name: 'Threesome', description: 'Three-person sexual services' },
  { name: 'Webcam Sex', description: 'Online webcam sexual services' },
] as const;
