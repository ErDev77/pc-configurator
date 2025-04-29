// src/app/api/admin/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function GET(req: NextRequest) {
	try {
		const cookieStore = await cookies()
		const token = cookieStore.get('admin_auth')?.value

		console.log('Checking authentication, token exists:', !!token)

		if (!token) {
			return NextResponse.json(
				{ error: 'No authentication token found' },
				{ status: 401 }
			)
		}

		try {
			// Verify the token
			const decoded = await verifyToken(token)

			// Return user data
			const response = NextResponse.json({
				id: decoded.id,
				email: decoded.email,
			})

			// Add no-cache headers
			response.headers.set(
				'Cache-Control',
				'no-store, no-cache, must-revalidate, proxy-revalidate'
			)
			response.headers.set('Pragma', 'no-cache')
			response.headers.set('Expires', '0')

			return response
		} catch (tokenError) {
			console.error('Token verification failed:', tokenError)

			// Clear the invalid cookie
			cookieStore.delete('admin_auth')

			return NextResponse.json(
				{ error: 'Invalid authentication token' },
				{ status: 401 }
			)
		}
	} catch (error) {
		console.error('Error in /api/admin/me route:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
