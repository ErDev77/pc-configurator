// src/app/api/admin/2fa/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, signToken } from '@/lib/jwt'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
	try {
		// Get the code from the request
		const { code } = await req.json()

		if (!code) {
			return NextResponse.json(
				{ error: 'Verification code is required' },
				{ status: 400 }
			)
		}

		// Get the auth token
		const cookieStore = await cookies()
		const token = cookieStore.get('admin_auth')?.value

		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Verify the token
		const decoded = await verifyToken(token)

		// Check if the code is valid and not expired
		const codeResult = await pool.query(
			'SELECT * FROM verification_codes WHERE admin_id = $1 AND code = $2 AND expires_at > NOW()',
			[decoded.id, code]
		)

		if (codeResult.rows.length === 0) {
			return NextResponse.json(
				{ error: 'Invalid or expired verification code' },
				{ status: 400 }
			)
		}

		// Code is valid, mark it as used
		await pool.query(
			'UPDATE verification_codes SET used = true, updated_at = NOW() WHERE admin_id = $1',
			[decoded.id]
		)

		// Generate a new token with 2FA verification flag
		const newToken = await signToken({
			id: decoded.id,
			email: decoded.email,
			twoFactorEnabled: true,
			twoFactorVerified: true,
		})

		// Set the new token in the cookies
		cookieStore.set('admin_auth', newToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24, // 1 day
		})

		return NextResponse.json({
			success: true,
			message: 'Two-factor authentication successful',
		})
	} catch (error) {
		console.error('Error verifying 2FA code:', error)
		return NextResponse.json({ error: 'Error verifying code' }, { status: 500 })
	}
}
