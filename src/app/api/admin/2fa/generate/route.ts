// src/app/api/admin/2fa/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import pool from '@/lib/db'
import { send2FAVerificationEmail } from '@/lib/emailService'

export async function POST(req: NextRequest) {
	try {
		// Get the auth token
		const cookieStore = await cookies()
		const token = cookieStore.get('admin_auth')?.value

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Verify the token
		const decoded = await verifyToken(token)

		// Generate a 6-digit code
		const code = randomInt(100000, 999999).toString()

		// Get admin email
		const adminResult = await pool.query(
			'SELECT email, two_factor_method FROM admins WHERE id = $1',
			[decoded.id]
		)

		if (adminResult.rows.length === 0) {
			return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
		}

		const admin = adminResult.rows[0]

		// Store the code in the database with an expiration time (10 minutes)
		const expiresAt = new Date()
		expiresAt.setMinutes(expiresAt.getMinutes() + 10)

		// Check if there's an existing code for this admin
		const existingCodeResult = await pool.query(
			'SELECT * FROM verification_codes WHERE admin_id = $1',
			[decoded.id]
		)

		if (existingCodeResult.rows.length > 0) {
			// Update the existing code
			await pool.query(
				'UPDATE verification_codes SET code = $1, expires_at = $2, updated_at = NOW() WHERE admin_id = $3',
				[code, expiresAt, decoded.id]
			)
		} else {
			// Insert a new code
			await pool.query(
				'INSERT INTO verification_codes (admin_id, code, expires_at, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
				[decoded.id, code, expiresAt]
			)
		}

		// If the method is email, send the code via our email service
		if (admin.two_factor_method === 'email') {
			await send2FAVerificationEmail(admin.email, code)
		}

		// For development/testing, also store the code in a cookie so the frontend can access it
		// IMPORTANT: Remove this in production - it's only for testing!
		if (process.env.NODE_ENV !== 'production') {
			cookieStore.set('dev_2fa_code', code, {
				path: '/',
				maxAge: 600, // 10 minutes
				httpOnly: false, // Make it accessible from JavaScript for testing
			})
		}

		return NextResponse.json({
			success: true,
			message: `Verification code sent via ${admin.two_factor_method}`,
			// For development only:
			dev_code: process.env.NODE_ENV === 'development' ? code : undefined,
		})
	} catch (error) {
		console.error('Error generating 2FA code:', error)
		return NextResponse.json(
			{ error: 'Error generating verification code' },
			{ status: 500 }
		)
	}
}
