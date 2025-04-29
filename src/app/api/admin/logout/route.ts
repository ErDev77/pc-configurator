// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
	try {
		// Properly await the cookie store
		const cookieStore = await cookies()

		cookieStore.set('admin_auth', '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 0, // Expire the cookie immediately
			path: '/',
		})

		// Add no-cache headers
		const response = NextResponse.json({ success: true })
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
		response.headers.set('Pragma', 'no-cache')

		return response
	} catch (error) {
		console.error('Error during logout:', error)
		return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
	}
}
