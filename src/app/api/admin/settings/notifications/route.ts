// src/app/api/admin/settings/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Get notification settings
export async function GET() {
	try {
		// Get active settings
		const settingsResult = await pool.query(
			'SELECT * FROM notification_settings WHERE is_active = true LIMIT 1'
		)

		// If no settings exist, create default settings
		if (settingsResult.rows.length === 0) {
			const defaultSettings = {
				name: 'Default Settings',
				email_enabled: true,
				telegram_enabled: true,
				email_recipient: process.env.EMAIL_TO || 'store@example.com',
				telegram_chat_id: process.env.TELEGRAM_CHAT_ID,
				is_active: true,
			}

			const insertResult = await pool.query(
				`INSERT INTO notification_settings 
        (name, email_enabled, telegram_enabled, email_recipient, telegram_chat_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
				[
					defaultSettings.name,
					defaultSettings.email_enabled,
					defaultSettings.telegram_enabled,
					defaultSettings.email_recipient,
					defaultSettings.telegram_chat_id,
					defaultSettings.is_active,
				]
			)

			return NextResponse.json(insertResult.rows[0])
		}

		// Return existing settings
		return NextResponse.json(settingsResult.rows[0])
	} catch (error) {
		console.error('Error fetching notification settings:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch notification settings' },
			{ status: 500 }
		)
	}
}

// Update notification settings
export async function PUT(request: NextRequest) {
	try {
		const settings = await request.json()

		// Validate required fields
		if (!settings || !settings.id) {
			return NextResponse.json(
				{ error: 'Settings ID is required' },
				{ status: 400 }
			)
		}

		// Update settings
		const updateResult = await pool.query(
			`UPDATE notification_settings 
      SET 
        name = $1, 
        email_enabled = $2, 
        telegram_enabled = $3, 
        email_recipient = $4, 
        updated_at = NOW()
      WHERE id = $5
      RETURNING *`,
			[
				settings.name,
				settings.email_enabled,
				settings.telegram_enabled,
				settings.email_recipient,
				settings.id,
			]
		)

		if (updateResult.rows.length === 0) {
			return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
		}

		return NextResponse.json(updateResult.rows[0])
	} catch (error) {
		console.error('Error updating notification settings:', error)
		return NextResponse.json(
			{ error: 'Failed to update notification settings' },
			{ status: 500 }
		)
	}
}
