// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/jwt'
import pool from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
	try {
		const { email, password } = await req.json()
		console.log(`Login attempt for email: ${email}`)

		const result = await pool.query('SELECT * FROM admins WHERE email = $1', [
			email,
		])
		const admin = result.rows[0]

		if (!admin) {
			console.log('Admin not found')
			return NextResponse.json({ error: 'Admin not found' }, { status: 401 })
		}

		const isValid = await bcrypt.compare(password, admin.password)
		if (!isValid) {
			console.log('Invalid password')
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Include 2FA status in the token
		const twoFactorEnabled = admin.two_factor_enabled || false

		// Generate new token with admin data and 2FA status
		const token = await signToken({
			id: admin.id,
			email: admin.email,
			twoFactorEnabled,
			twoFactorVerified: !twoFactorEnabled, // If 2FA is not enabled, consider it verified
		})

		console.log('Authentication successful, setting cookie...')

		// Get cookie store - properly awaited
		const cookieStore = await cookies()

		// Clear any existing auth cookie first
		cookieStore.delete('admin_auth')

		// Set a new cookie with stricter parameters
		cookieStore.set('admin_auth', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'lax', // Use 'lax' for better compatibility
			maxAge: 60 * 60 * 24, // 1 day
		})

		console.log('Cookie set successfully')

		// Set no-cache headers in the response
		const response = NextResponse.json({
			success: true,
			message: 'Authentication successful',
			requireTwoFactor: twoFactorEnabled,
		})

		// Add cache-control headers
		response.headers.set(
			'Cache-Control',
			'no-store, no-cache, must-revalidate, proxy-revalidate'
		)
		response.headers.set('Pragma', 'no-cache')
		response.headers.set('Expires', '0')

		return response
	} catch (error) {
		console.error('Error during login:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
