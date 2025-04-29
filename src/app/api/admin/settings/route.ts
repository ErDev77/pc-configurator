import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

// Helper function to get the current admin ID from the token
async function getCurrentAdminId(req: NextRequest) {
	const cookieStore = await cookies()
	const token = cookieStore.get('admin_auth')?.value

	if (!token) {
		return null
	}

	try {
		const decoded = await verifyToken(token)
		return decoded.id
	} catch (error) {
		console.error('Error verifying token:', error)
		return null
	}
}

// GET handler to retrieve notification settings
export async function GET(req: NextRequest) {
	try {
		// Get the current admin ID
		const adminId = await getCurrentAdminId(req)

		if (!adminId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Check if settings table exists, and create it if it doesn't
		const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'settings'
      );
    `)

		const tableExists = checkTableResult.rows[0].exists

		if (!tableExists) {
			// Create settings table with admin_id column
			await pool.query(`
        CREATE TABLE settings (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL,
          key VARCHAR(255) NOT NULL,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(admin_id, key)
        );
      `)
		}

		// Query the current notification settings for this admin
		const result = await pool.query(
			`
      SELECT value FROM settings 
      WHERE key = 'notifications' AND admin_id = $1;
    `,
			[adminId]
		)

		if (result.rows.length === 0) {
			// If no settings found for this admin, insert default ones
			const defaultSettings = { email: true, telegram: true }

			await pool.query(
				`
        INSERT INTO settings (admin_id, key, value) 
        VALUES ($1, 'notifications', $2);
      `,
				[adminId, JSON.stringify(defaultSettings)]
			)

			return NextResponse.json({
				notifications: defaultSettings,
			})
		}

		return NextResponse.json({
			notifications: result.rows[0].value,
		})
	} catch (error) {
		console.error('Error retrieving settings:', error)
		return NextResponse.json(
			{ error: 'Failed to retrieve settings' },
			{ status: 500 }
		)
	}
}

// POST handler to update notification settings
export async function POST(req: NextRequest) {
	try {
		// Get the current admin ID
		const adminId = await getCurrentAdminId(req)

		if (!adminId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await req.json()
		const { notifications } = body

		if (!notifications) {
			return NextResponse.json(
				{ error: 'Notification settings are required' },
				{ status: 400 }
			)
		}

		// Check if settings table exists, and create it if it doesn't
		const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'settings'
      );
    `)

		const tableExists = checkTableResult.rows[0].exists

		if (!tableExists) {
			// Create settings table with admin_id column
			await pool.query(`
        CREATE TABLE settings (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL,
          key VARCHAR(255) NOT NULL,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(admin_id, key)
        );
      `)
		}

		// Upsert notification settings for this admin
		await pool.query(
			`
      INSERT INTO settings (admin_id, key, value, updated_at) 
      VALUES ($1, 'notifications', $2, CURRENT_TIMESTAMP)
      ON CONFLICT (admin_id, key) 
      DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP;
    `,
			[adminId, JSON.stringify(notifications)]
		)

		return NextResponse.json({
			success: true,
			message: 'Settings updated successfully',
		})
	} catch (error) {
		console.error('Error updating settings:', error)
		return NextResponse.json(
			{ error: 'Failed to update settings' },
			{ status: 500 }
		)
	}
}
