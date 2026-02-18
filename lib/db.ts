import { Pool } from '@neondatabase/serverless'

const pool = new Pool({
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
      query += ` AND (location_city ILIKE $${paramIndex} OR location_address ILIKE $${paramIndex})`
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
      location_city, 
      location_address,
      description,
      created_at
    FROM submissions 
    WHERE status = $1 
    AND (
      restaurant_name ILIKE $2 
      OR creator_name ILIKE $2 
      OR description ILIKE $2
    )`

    const params: any[] = ['approved', `%${query}%`]
    let paramIndex = 3

    if (location) {
      sqlQuery += ` AND (location_city ILIKE $${paramIndex} OR location_address ILIKE $${paramIndex})`
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
        location_city,
        location_address,
        description,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at`,
      [
        data.restaurant_name,
        data.creator_name,
        data.creator_email,
        data.instagram_url,
        JSON.stringify(data.meal_types),
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
