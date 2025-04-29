// src/app/api/admin/2fa/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function GET(req: NextRequest) {
	try {
		// Get the auth token
		const cookieStore = await cookies()
		const token = cookieStore.get('admin_auth')?.value

		if (!token) {
			return NextResponse.json(
				{ error: 'Unauthorized', enabled: false },
				{ status: 401 }
			)
		}

		// Verify the token
		const decoded = await verifyToken(token)

		// Use the information from the token directly
		const twoFactorEnabled = decoded.twoFactorEnabled || false
		const twoFactorVerified = decoded.twoFactorVerified || false

		return NextResponse.json({
			enabled: twoFactorEnabled,
			verified: twoFactorVerified,
			method: 'email', // Default to email method
		})
	} catch (error) {
		console.error('Error checking 2FA status:', error)
		return NextResponse.json(
			{ error: 'Error checking 2FA status', enabled: false },
			{ status: 500 }
		)
	}
}
