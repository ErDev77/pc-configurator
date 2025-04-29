import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { signToken, verifyToken } from '@/lib/jwt'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
	try {
		// Get the method from the request
		const { method } = await req.json()

		if (!method || !['email', 'app'].includes(method)) {
			return NextResponse.json(
				{ error: 'Valid method (email or app) is required' },
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

		// Update the admin's 2FA settings
		await pool.query(
			'UPDATE admins SET two_factor_enabled = true, two_factor_method = $1, updated_at = NOW() WHERE id = $2',
			[method, decoded.id]
		)

		return NextResponse.json({
			success: true,
			message: `Two-factor authentication enabled with ${method} method`,
		})
	} catch (error) {
		console.error('Error enabling 2FA:', error)
		return NextResponse.json(
			{ error: 'Error enabling two-factor authentication' },
			{ status: 500 }
		)
	}
}
