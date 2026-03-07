import { db, COLLECTIONS } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export interface Location {
  id: string;
  name: string;
  region: string;
  isActive: boolean;
}

export async function getActiveLocations(): Promise<Location[]> {
  try {
    // Get all locations and filter/sort in memory to avoid needing an index
    const snapshot = await getDocs(collection(db, COLLECTIONS.LOCATIONS));
    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Location[];
    
    // Filter active and sort in memory
    return locations
      .filter(loc => loc.isActive)
      .sort((a, b) => {
        // Sort by region first, then by name
        const regionCompare = a.region.localeCompare(b.region);
        if (regionCompare !== 0) return regionCompare;
        return a.name.localeCompare(b.name);
      });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

export async function getAllLocations(): Promise<Location[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.LOCATIONS));
    const locations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Location[];
    
    // Sort in memory
    return locations.sort((a, b) => {
      const regionCompare = a.region.localeCompare(b.region);
      if (regionCompare !== 0) return regionCompare;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

// Group locations by region for dropdown display
export function groupLocationsByRegion(locations: Location[]): Record<string, Location[]> {
  return locations.reduce((acc, loc) => {
    if (!acc[loc.region]) {
      acc[loc.region] = [];
    }
    acc[loc.region].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);
}
