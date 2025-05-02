// src/app/api/admin/security-settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

// GET: Retrieve security settings
export async function GET(req: NextRequest) {
	try {
		// Check if the security_settings table exists
		const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'security_settings'
      );
    `)

		if (!checkTableResult.rows[0].exists) {
			// Create the table if it doesn't exist
			await pool.query(`
        CREATE TABLE security_settings (
          id SERIAL PRIMARY KEY,
          session_timeout_minutes INTEGER DEFAULT 60,
          max_login_attempts INTEGER DEFAULT 5,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)

			// Insert default settings
			await pool.query(`
        INSERT INTO security_settings (session_timeout_minutes, max_login_attempts)
        VALUES (60, 5);
      `)
		}

		// Get the settings
		const result = await pool.query(
			'SELECT * FROM security_settings ORDER BY id DESC LIMIT 1'
		)

		if (result.rows.length === 0) {
			// Return default settings if none exist
			return NextResponse.json({
				session_timeout_minutes: 60,
				max_login_attempts: 5,
			})
		}

		return NextResponse.json(result.rows[0])
	} catch (error) {
		console.error('Error retrieving security settings:', error)
		return NextResponse.json(
			{ error: 'Failed to retrieve security settings' },
			{ status: 500 }
		)
	}
}

// POST: Update security settings
export async function POST(req: NextRequest) {
	try {
		// Verify authentication
		const cookieStore = await cookies()
		const token = cookieStore.get('admin_auth')?.value

		if (!token) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
		}

		const decoded = await verifyToken(token)
		if (!decoded) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
		}

		const body = await req.json()
		const { session_timeout_minutes, max_login_attempts } = body

		// Validate input
		if (
			session_timeout_minutes &&
			(session_timeout_minutes < 5 || session_timeout_minutes > 1440)
		) {
			return NextResponse.json(
				{ error: 'Session timeout must be between 5 and 1440 minutes' },
				{ status: 400 }
			)
		}

		if (
			max_login_attempts &&
			(max_login_attempts < 1 || max_login_attempts > 10)
		) {
			return NextResponse.json(
				{ error: 'Maximum login attempts must be between 1 and 10' },
				{ status: 400 }
			)
		}

		// Check if settings exist
		const checkResult = await pool.query(
			'SELECT id FROM security_settings LIMIT 1'
		)

		if (checkResult.rows.length === 0) {
			// Insert new settings
			await pool.query(
				`INSERT INTO security_settings (session_timeout_minutes, max_login_attempts)
         VALUES ($1, $2)`,
				[session_timeout_minutes || 60, max_login_attempts || 5]
			)
		} else {
			// Update existing settings
			await pool.query(
				`UPDATE security_settings 
         SET session_timeout_minutes = $1, 
             max_login_attempts = $2, 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
				[session_timeout_minutes, max_login_attempts, checkResult.rows[0].id]
			)
		}

		return NextResponse.json({
			success: true,
			message: 'Security settings updated successfully',
		})
	} catch (error) {
		console.error('Error updating security settings:', error)
		return NextResponse.json(
			{ error: 'Failed to update security settings' },
			{ status: 500 }
		)
	}
}
