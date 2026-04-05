// src/common/helpers/location.helper.ts

export interface SanitizedAuthor {
    id: string;
    name: string;
    avatarUrl: string | null;
    locationName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }
  
  /**
   * Strips or masks location data from an author object based on their
   * locationPrivacy setting. Import SanitizedAuthor from this file in
   * both community.service.ts and groups.service.ts.
   *
   * Privacy rules:
   *  'exact'   → return full coordinates + locationName
   *  'city'    → return locationName only (no coords)
   *  'country' → return locationName only (no coords)
   *  'none'    → return neither locationName nor coords
   *  undefined → default to 'city' behaviour (locationName only)
   */
  export function sanitizeAuthor(author: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    locationName?: string | null;
    locationPrivacy?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null): SanitizedAuthor | null {
    if (!author) return null;
  
    const base: SanitizedAuthor = {
      id: author.id,
      name: author.name,
      avatarUrl: author.avatarUrl ?? null,
    };
  
    const privacy = author.locationPrivacy ?? 'city';
  
    switch (privacy) {
      case 'exact':
        return {
          ...base,
          locationName: author.locationName ?? null,
          latitude: author.latitude ?? null,
          longitude: author.longitude ?? null,
        };
  
      case 'city':
      case 'country':
        return {
          ...base,
          locationName: author.locationName ?? null,
        };
  
      case 'none':
      default:
        return base;
    }
  }
  
  /**
   * Calculates distance in km between two lat/lng points using
   * the Haversine formula. Returns null if any coordinate is missing.
   */
  export function calculateDistance(
    lat1: number | null | undefined,
    lon1: number | null | undefined,
    lat2: number | null | undefined,
    lon2: number | null | undefined,
  ): number | null {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }