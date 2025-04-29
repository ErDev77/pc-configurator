// src/app/api/admin/settings/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { email } = body

		// Get notification settings
		const settingsResult = await pool.query(
			'SELECT * FROM notification_settings WHERE is_active = true LIMIT 1'
		)

		if (
			settingsResult.rows.length === 0 ||
			!settingsResult.rows[0].email_enabled
		) {
			return NextResponse.json(
				{ error: 'Email notifications are disabled' },
				{ status: 400 }
			)
		}

		// Use provided email or the one from settings
		const recipientEmail =
			email || settingsResult.rows[0].email_recipient || process.env.EMAIL_TO

		if (!recipientEmail) {
			return NextResponse.json(
				{ error: 'No recipient email configured' },
				{ status: 400 }
			)
		}

		// Create email transport
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.EMAIL_PORT || '587'),
			secure: process.env.EMAIL_SECURE === 'true',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		})

		// Send test email
		await transporter.sendMail({
			from: process.env.EMAIL_FROM || 'store@example.com',
			to: recipientEmail,
			subject: 'Test Email from Your PC Store',
			html: `
        <h1>Test Email</h1>
        <p>This is a test email from your PC Store admin panel.</p>
        <p>If you're receiving this, your email notification system is working correctly!</p>
        <p>Time sent: ${new Date().toLocaleString()}</p>
      `,
		})

		return NextResponse.json({
			success: true,
			message: 'Test email sent successfully',
		})
	} catch (error) {
		console.error('Error sending test email:', error)
		return NextResponse.json(
			{ error: 'Failed to send test email', details: (error as Error).message },
			{ status: 500 }
		)
	}
}

// src/app/api/admin/settings/test-telegram/route.ts
