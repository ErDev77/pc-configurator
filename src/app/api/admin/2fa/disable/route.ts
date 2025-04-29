import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import pool from '@/lib/db'

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

		// Update the admin's 2FA settings
		await pool.query(
			'UPDATE admins SET two_factor_enabled = false, updated_at = NOW() WHERE id = $1',
			[decoded.id]
		)

		// Clean up any verification codes
		await pool.query('DELETE FROM verification_codes WHERE admin_id = $1', [
			decoded.id,
		])

		return NextResponse.json({
			success: true,
			message: 'Two-factor authentication disabled',
		})
	} catch (error) {
		console.error('Error disabling 2FA:', error)
		return NextResponse.json(
			{ error: 'Error disabling two-factor authentication' },
			{ status: 500 }
		)
	}
}
