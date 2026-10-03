/**
 * VistaBite V2 Types
 * Strongly typed models for the V2 data model.
 * Kept in sync with migrations/001_v2_foundation.sql
 */

export type BusinessType = 'restaurant' | 'cafe' | 'hotel' | 'food_truck' | 'bakery' | 'bar' | 'other';

export type LocationSource = 'manual' | 'ai_extracted' | 'user_edited' | 'geocoded' | 'gps';

export type ProcessingJobStatus = 'queued' | 'processing' | 'needs_review' | 'completed' | 'failed';

export type ProcessingJobType = 'instagram_extraction' | 'ocr' | 'speech_to_text' | 'geocoding' | 'ai_analysis';

/**
 * User - authenticated user of the application
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * SavedSpot - a user's saved restaurant/cafe/hotel/food location
 * Supports PostGIS geography(POINT, 4326) for future radius queries
 */
export interface SavedSpot {
  id: string;
  user_id: string;
  /** Permanent personal save number (#1, #2, ...). Never changes after creation. */
  save_sequence: number;
  name: string;
  business_type: BusinessType | null;
  cuisine: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  // PostGIS geography point (lon, lat) - for radius queries
  // Not serialized directly; use latitude/longitude instead
  location_source: LocationSource;
  location_confidence: number | null;
  user_confirmed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * SavedReel - an Instagram Reel associated with a saved spot
 * A spot can have multiple reels
 */
export interface SavedReel {
  id: string;
  saved_spot_id: string;
  user_id: string;
  instagram_url: string;
  instagram_shortcode: string | null;
  creator_name: string | null;
  creator_handle: string | null;
  caption: string | null;
  thumbnail_url: string | null;
  extracted_text: string | null;
  transcript: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * ProcessingJob - async job for processing reels (future phases)
 */
export interface ProcessingJob {
  id: string;
  user_id: string;
  saved_reel_id: string;
  job_type: ProcessingJobType;
  status: ProcessingJobStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input types for creating entities (exclude generated fields)
 */
export interface CreateSavedSpotInput {
  name: string;
  business_type?: BusinessType;
  cuisine?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  location_source?: LocationSource;
  location_confidence?: number;
  user_confirmed?: boolean;
  notes?: string;
  // save_sequence is NOT accepted from the client — the server assigns it.
}

export interface UpdateSavedSpotInput {
  name?: string;
  business_type?: BusinessType;
  cuisine?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  location_source?: LocationSource;
  location_confidence?: number;
  user_confirmed?: boolean;
  notes?: string;
}

export interface CreateSavedReelInput {
  saved_spot_id: string;
  instagram_url: string;
  instagram_shortcode?: string;
  creator_name?: string;
  creator_handle?: string;
  caption?: string;
  thumbnail_url?: string;
  extracted_text?: string;
  transcript?: string;
}

export interface CreateProcessingJobInput {
  saved_reel_id: string;
  job_type: ProcessingJobType;
}

/**
 * API response types
 */
export interface SavedSpotWithReels extends SavedSpot {
  reels: SavedReel[];
}

/** SavedSpot enriched with reel count — used for list views */
export interface SpotWithReelCount extends SavedSpot {
  reel_count: number;
}

/**
 * NearbySavedSpot - a SavedSpot with computed distance for radius queries
 * Used only for Nearby API responses and UI - not persisted
 */
export interface NearbySavedSpot extends SavedSpot {
  distance_meters: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Location data rule: AI-derived vs user-confirmed
 *
 * - extracted location: AI analysis result (location_source = 'ai_extracted')
 * - final saved location: the canonical lat/lng used for queries
 * - location_source: tracks origin ('manual', 'ai_extracted', 'user_edited', 'geocoded', 'gps')
 * - location_confidence: confidence score (0-1)
 * - user_confirmed: whether user explicitly verified the location
 *
 * Future flow: AI says "FC Road, Pune" → user edits to "Kothrud, Pune" → user confirms
 * → user_confirmed=true, location_source='user_edited', final location used for Nearby search
 */