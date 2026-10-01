import { Pool } from '@neondatabase/serverless'
import type { 
  User, 
  SavedSpot, 
  SavedReel, 
  ProcessingJob 
} from '@/lib/v2-types'

// Exported so lib/session.ts can use the same pool instance
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export interface Submission {
  id: string
  restaurant_name: string
  creator_name: string
  creator_email: string
  instagram_url: string
  meal_types: string[]
  location_city: string
  location_address: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string
}

/**
 * V2 User and Authentication Types
 */
export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

/**
 * Authentication Functions
 */

/**
 * Get user by email.
 * Returns user or null if not found.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await pool.query(
      'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE email = $1',
      [email]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error fetching user by email:', error)
    throw error
  }
}

/**
 * Get user by ID.
 * Returns user or null if not found.
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await pool.query(
      'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error fetching user by ID:', error)
    throw error
  }
}

/**
 * Verify user credentials (email + password).
 * Returns user if credentials are valid, null otherwise.
 */
export async function verifyUserCredentials(email: string, password: string): Promise<User | null> {
  try {
    const user = await getUserByEmail(email)
    if (!user) return null

    // Need to fetch the password hash separately since getUserByEmail doesn't return it
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [email]
    )
    if (result.rows.length === 0) return null

    const passwordHash = result.rows[0].password_hash
    if (!passwordHash) return null

    // Verify password using auth.ts function
    const { verifyPassword } = await import('./auth')
    const isValid = await verifyPassword(password, passwordHash)

    if (!isValid) return null

    // Return user without password hash
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  } catch (error) {
    console.error('[v0] Error verifying user credentials:', error)
    throw error
  }
}

/**
 * Create a new user.
 * Returns the created user (without password hash).
 */
export async function createUser(email: string, name: string, passwordHash: string): Promise<User> {
  try {
    const result = await pool.query(
      `INSERT INTO users (
        email,
        name,
        password_hash
      ) VALUES ($1, $2, $3)
      RETURNING id, created_at, updated_at`,
      [email, name, passwordHash]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      email: email,
      name: name,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error creating user:', error)
    throw error
  }
}

/**
 * Session Functions
 */

/**
 * Create a new session for a user.
 * Returns the raw session token to be set as cookie.
 */
export async function createSession(userId: string): Promise<string> {
  try {
    const { generateSessionToken, hashSessionToken, getSessionMaxAge } = await import('./auth')

    const token = generateSessionToken()
    const tokenHash = hashSessionToken(token)
    const expiresAt = new Date(Date.now() + getSessionMaxAge() * 1000)

    await pool.query(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, tokenHash, expiresAt.toISOString()]
    )

    return token
  } catch (error) {
    console.error('[v0] Error creating session:', error)
    throw error
  }
}

/**
 * Get user for a session token.
 * Returns user if session is valid and not expired, null otherwise.
 */
export async function getSessionUser(token: string): Promise<User | null> {
  try {
    const { hashSessionToken } = await import('./auth')

    const tokenHash = hashSessionToken(token)

    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.created_at, u.updated_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    )

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error fetching session user:', error)
    throw error
  }
}

/**
 * Delete a session by token (logout).
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    const { hashSessionToken } = await import('./auth')

    const tokenHash = hashSessionToken(token)

    await pool.query(
      'DELETE FROM sessions WHERE token_hash = $1',
      [tokenHash]
    )
  } catch (error) {
    console.error('[v0] Error deleting session:', error)
    throw error
  }
}

/**
 * V2 Saved Spots Functions
 */

/**
 * Create a new saved spot for a user.
 * Returns the created spot.
 */
export async function createSavedSpot(userId: string, data: {
  name: string;
  business_type?: string;
  cuisine?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  location_source?: string;
  location_confidence?: number;
  user_confirmed?: boolean;
  notes?: string;
}): Promise<SavedSpot> {
  try {
    const result = await pool.query(
      `INSERT INTO saved_spots (
        user_id,
        name,
        business_type,
        cuisine,
        address,
        city,
        state,
        country,
        latitude,
        longitude,
        location_source,
        location_confidence,
        user_confirmed,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId,
        data.name,
        data.business_type ?? null,
        data.cuisine ?? null,
        data.address ?? null,
        data.city ?? null,
        data.state ?? null,
        data.country ?? null,
        data.latitude ?? null,
        data.longitude ?? null,
        data.location_source ?? 'manual',
        data.location_confidence ?? null,
        data.user_confirmed ?? false,
        data.notes ?? null
      ]
    )

    const row = result.rows[0]
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      business_type: row.business_type,
      cuisine: row.cuisine,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      location_source: row.location_source,
      location_confidence: row.location_confidence,
      user_confirmed: row.user_confirmed,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error creating saved spot:', error)
    throw error
  }
}

/**
 * Get all saved spots for a user.
 */
export async function getSavedSpotsForUser(userId: string): Promise<SavedSpot[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM saved_spots WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      business_type: row.business_type,
      cuisine: row.cuisine,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      location_source: row.location_source,
      location_confidence: row.location_confidence,
      user_confirmed: row.user_confirmed,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  } catch (error) {
    console.error('[v0] Error fetching saved spots for user:', error)
    throw error
  }
}

/**
 * Get a specific saved spot for a user (with ownership check).
 * Returns spot or null if not found or doesn't belong to user.
 */
export async function getSavedSpotForUser(userId: string, spotId: string): Promise<SavedSpot | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM saved_spots WHERE id = $1 AND user_id = $2',
      [spotId, userId]
    )

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      business_type: row.business_type,
      cuisine: row.cuisine,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      location_source: row.location_source,
      location_confidence: row.location_confidence,
      user_confirmed: row.user_confirmed,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error fetching saved spot for user:', error)
    throw error
  }
}

/**
 * Update a saved spot for a user (with ownership check).
 * Returns updated spot or null if not found or doesn't belong to user.
 */
export async function updateSavedSpot(userId: string, spotId: string, data: {
  name?: string;
  business_type?: string;
  cuisine?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  location_source?: string;
  location_confidence?: number;
  user_confirmed?: boolean;
  notes?: string;
}): Promise<SavedSpot | null> {
  try {
    // Build dynamic update query
    const updates = []
    const values: any[] = [userId, spotId] // First two params for WHERE clause
    let paramIndex = 3

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(data.name)
    }
    if (data.business_type !== undefined) {
      updates.push(`business_type = $${paramIndex++}`)
      values.push(data.business_type)
    }
    if (data.cuisine !== undefined) {
      updates.push(`cuisine = $${paramIndex++}`)
      values.push(data.cuisine)
    }
    if (data.address !== undefined) {
      updates.push(`address = $${paramIndex++}`)
      values.push(data.address)
    }
    if (data.city !== undefined) {
      updates.push(`city = $${paramIndex++}`)
      values.push(data.city)
    }
    if (data.state !== undefined) {
      updates.push(`state = $${paramIndex++}`)
      values.push(data.state)
    }
    if (data.country !== undefined) {
      updates.push(`country = $${paramIndex++}`)
      values.push(data.country)
    }
    if (data.latitude !== undefined) {
      updates.push(`latitude = $${paramIndex++}`)
      values.push(data.latitude)
    }
    if (data.longitude !== undefined) {
      updates.push(`longitude = $${paramIndex++}`)
      values.push(data.longitude)
    }
    if (data.location_source !== undefined) {
      updates.push(`location_source = $${paramIndex++}`)
      values.push(data.location_source)
    }
    if (data.location_confidence !== undefined) {
      updates.push(`location_confidence = $${paramIndex++}`)
      values.push(data.location_confidence)
    }
    if (data.user_confirmed !== undefined) {
      updates.push(`user_confirmed = $${paramIndex++}`)
      values.push(data.user_confirmed)
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`)
      values.push(data.notes)
    }

    if (updates.length === 0) {
      // No updates to make
      return await getSavedSpotForUser(userId, spotId)
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`)

    const query = `
      UPDATE saved_spots
      SET ${updates.join(', ')}
      WHERE id = $2 AND user_id = $1
      RETURNING *
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      business_type: row.business_type,
      cuisine: row.cuisine,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      location_source: row.location_source,
      location_confidence: row.location_confidence,
      user_confirmed: row.user_confirmed,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error updating saved spot:', error)
    throw error
  }
}

/**
 * Delete a saved spot for a user (with ownership check).
 * Returns true if deleted, false if not found or doesn't belong to user.
 */
export async function deleteSavedSpot(userId: string, spotId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'DELETE FROM saved_spots WHERE id = $1 AND user_id = $2 RETURNING id',
      [spotId, userId]
    )

    return result.rows.length > 0
  } catch (error) {
    console.error('[v0] Error deleting saved spot:', error)
    throw error
  }
}

/**
 * V2 Saved Reels Functions
 */

/**
 * Create a new saved reel.
 * Returns the created reel.
 */
export async function createSavedReel(data: {
  saved_spot_id: string;
  user_id: string;
  instagram_url: string;
  instagram_shortcode?: string;
  creator_name?: string;
  creator_handle?: string;
  caption?: string;
  thumbnail_url?: string;
  extracted_text?: string;
  transcript?: string;
}): Promise<SavedReel> {
  try {
    const result = await pool.query(
      `INSERT INTO saved_reels (
        saved_spot_id,
        user_id,
        instagram_url,
        instagram_shortcode,
        creator_name,
        creator_handle,
        caption,
        thumbnail_url,
        extracted_text,
        transcript
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.saved_spot_id,
        data.user_id,
        data.instagram_url,
        data.instagram_shortcode ?? null,
        data.creator_name ?? null,
        data.creator_handle ?? null,
        data.caption ?? null,
        data.thumbnail_url ?? null,
        data.extracted_text ?? null,
        data.transcript ?? null
      ]
    )

    const row = result.rows[0]
    return {
      id: row.id,
      saved_spot_id: row.saved_spot_id,
      user_id: row.user_id,
      instagram_url: row.instagram_url,
      instagram_shortcode: row.instagram_shortcode,
      creator_name: row.creator_name,
      creator_handle: row.creator_handle,
      caption: row.caption,
      thumbnail_url: row.thumbnail_url,
      extracted_text: row.extracted_text,
      transcript: row.transcript,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error creating saved reel:', error)
    throw error
  }
}

/**
 * Get all saved reels for a spot (with ownership check via user_id).
 * Returns reels array.
 */
export async function getSavedReelsForSpot(userId: string, savedSpotId: string): Promise<SavedReel[]> {
  try {
    const result = await pool.query(
      `SELECT sr.* FROM saved_reels sr
       JOIN saved_spots ss ON sr.saved_spot_id = ss.id
       WHERE ss.id = $2 AND ss.user_id = $1
       ORDER BY sr.created_at DESC`,
      [userId, savedSpotId]
    )

    return result.rows.map(row => ({
      id: row.id,
      saved_spot_id: row.saved_spot_id,
      user_id: row.user_id,
      instagram_url: row.instagram_url,
      instagram_shortcode: row.instagram_shortcode,
      creator_name: row.creator_name,
      creator_handle: row.creator_handle,
      caption: row.caption,
      thumbnail_url: row.thumbnail_url,
      extracted_text: row.extracted_text,
      transcript: row.transcript,
      created_at: row.created_at,
      updated_at: row.updated_at
    }))
  } catch (error) {
    console.error('[v0] Error fetching saved reels for spot:', error)
    throw error
  }
}

/**
 * Get a specific saved reel for a user (with ownership check).
 * Returns reel or null if not found or doesn't belong to user.
 */
export async function getSavedReelForUser(userId: string, reelId: string): Promise<SavedReel | null> {
  try {
    const result = await pool.query(
      `SELECT sr.* FROM saved_reels sr
       JOIN saved_spots ss ON sr.saved_spot_id = ss.id
       WHERE sr.id = $2 AND ss.user_id = $1`,
      [userId, reelId]
    )

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      saved_spot_id: row.saved_spot_id,
      user_id: row.user_id,
      instagram_url: row.instagram_url,
      instagram_shortcode: row.instagram_shortcode,
      creator_name: row.creator_name,
      creator_handle: row.creator_handle,
      caption: row.caption,
      thumbnail_url: row.thumbnail_url,
      extracted_text: row.extracted_text,
      transcript: row.transcript,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error fetching saved reel for user:', error)
    throw error
  }
}

/**
 * V2 Processing Jobs Functions
 */

/**
 * Create a new processing job.
 * Returns the created job.
 */
export async function createProcessingJob(data: {
  user_id: string;
  saved_reel_id: string;
  job_type: string;
}): Promise<ProcessingJob> {
  try {
    const result = await pool.query(
      `INSERT INTO processing_jobs (
        user_id,
        saved_reel_id,
        job_type
      ) VALUES ($1, $2, $3)
      RETURNING *`,
      [
        data.user_id,
        data.saved_reel_id,
        data.job_type
      ]
    )

    const row = result.rows[0]
    return {
      id: row.id,
      user_id: row.user_id,
      saved_reel_id: row.saved_reel_id,
      job_type: row.job_type,
      status: row.status,
      error_message: row.error_message,
      started_at: row.started_at,
      completed_at: row.completed_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error creating processing job:', error)
    throw error
  }
}

/**
 * Get a processing job for a user (with ownership check).
 * Returns job or null if not found or doesn't belong to user.
 */
export async function getProcessingJobForUser(userId: string, jobId: string): Promise<ProcessingJob | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM processing_jobs WHERE id = $1 AND user_id = $2',
      [jobId, userId]
    )

    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      user_id: row.user_id,
      saved_reel_id: row.saved_reel_id,
      job_type: row.job_type,
      status: row.status,
      error_message: row.error_message,
      started_at: row.started_at,
      completed_at: row.completed_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  } catch (error) {
    console.error('[v0] Error fetching processing job for user:', error)
    throw error
  }
}

/**
 * V1 Submission Functions (kept unchanged for backward compatibility)
 */
/**
 * Get all approved reels from database
 */
export async function getApprovedReels() {
  try {
    const result = await pool.query(
      `SELECT
        id,
        restaurant_name,
        creator_name,
        instagram_url,
        meal_types,
        location_city,
        location_address,
        description,
        created_at
      FROM submissions
      WHERE status = $1
      ORDER BY created_at DESC`,
      ['approved']
    )
    return result.rows
  } catch (error) {
    console.error('[v0] Error fetching approved reels:', error)
    throw error
  }
}

/**
 * Get reels filtered by meal type and location
 */
export async function getFilteredReels(
  mealType?: string,
  location?: string
) {
  try {
    let query = `SELECT
      id,
      restaurant_name,
      creator_name,
      instagram_url,
      meal_types,
      location_city,
      location_address,
      description,
      created_at
    FROM submissions
    WHERE status = $1`

    const params: any[] = ['approved']
    let paramIndex = 2

    if (mealType) {
      query += ` AND $${paramIndex}::text = ANY(meal_types)`
      params.push(mealType)
      paramIndex++
    }

    if (location) {
      query += ` AND (city ILIKE $${paramIndex} OR restaurant_address ILIKE $${paramIndex})`
      params.push(`%${location}%`)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC`

    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error('[v0] Error fetching filtered reels:', error)
    throw error
  }
}

/**
 * Search reels by query
 */
export async function searchReels(query: string, location?: string, mealType?: string) {
  try {
    let sqlQuery = `SELECT
      id,
      restaurant_name,
      creator_name,
      instagram_url,
      meal_types,
      city,
      restaurant_address,
      reel_description,
      created_at
    FROM submissions
    WHERE status = $1
    AND (
      restaurant_name ILIKE $2
      OR creator_name ILIKE $2
      OR reel_description ILIKE $2
    )`

    const params: any[] = ['approved', `%${query}%`]
    let paramIndex = 3

    if (location) {
      sqlQuery += ` AND (city ILIKE $${paramIndex} OR restaurant_address ILIKE $${paramIndex})`
      params.push(`%${location}%`)
      paramIndex++
    }

    if (mealType) {
      sqlQuery += ` AND $${paramIndex}::text = ANY(meal_types)`
      params.push(mealType)
      paramIndex++
    }

    sqlQuery += ` ORDER BY created_at DESC`

    const result = await pool.query(sqlQuery, params)
    return result.rows
  } catch (error) {
    console.error('[v0] Error searching reels:', error)
    throw error
  }
}

/**
 * Submit a new reel
 */
export async function submitReel(data: {
  restaurant_name: string
  creator_name: string
  creator_email: string
  instagram_url: string
  meal_types: string[]
  location_city: string
  location_address: string
  description: string
}) {
  try {
    const result = await pool.query(
      `INSERT INTO submissions (
        restaurant_name,
        creator_name,
        creator_email,
        instagram_url,
        meal_types,
        city,
        location_address,
        reel_description,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at`,
      [
        data.restaurant_name,
        data.creator_name,
        data.creator_email,
        data.instagram_url,
        data.meal_types,
        data.location_city,
        data.location_address,
        data.description,
        'pending',
      ]
    )
    return result.rows[0]
  } catch (error) {
    console.error('[v0] Error submitting reel:', error)
    throw error
  }
}

/**
 * Get a single submission by ID
 */
export async function getSubmission(submissionId: string) {
  try {
    const result = await pool.query(
      `SELECT * FROM submissions WHERE id = $1`,
      [submissionId]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('[v0] Error fetching submission:', error)
    throw error
  }
}

/**
 * Get all pending submissions (for admin)
 */
export async function getPendingSubmissions() {
  try {
    const result = await pool.query(
      `SELECT * FROM submissions
       WHERE status = $1
       ORDER BY created_at ASC`,
      ['pending']
    )
    return result.rows
  } catch (error) {
    console.error('[v0] Error fetching pending submissions:', error)
    throw error
  }
}

/**
 * Approve a submission (for admin)
 */
export async function approveSubmission(submissionId: string) {
  try {
    const result = await pool.query(
      `UPDATE submissions
       SET status = $1, approved_at = NOW()
       WHERE id = $2
       RETURNING *`,
      ['approved', submissionId]
    )
    return result.rows[0]
  } catch (error) {
    console.error('[v0] Error approving submission:', error)
    throw error
  }
}

/**
 * Reject a submission (for admin)
 */
export async function rejectSubmission(submissionId: string) {
  try {
    const result = await pool.query(
      `UPDATE submissions
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      ['rejected', submissionId]
    )
    return result.rows[0]
  } catch (error) {
    console.error('[v0] Error rejecting submission:', error)
    throw error
  }
}

