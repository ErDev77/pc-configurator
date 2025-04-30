import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname
	const isAdminRoute = pathname.startsWith('/admin')
	const isLoginPage = pathname === '/admin/login'
	const isPublicApiRoute =
		pathname.startsWith('/api/admin/login') ||

	console.log('Middleware checking route:', pathname)

	// Skip middleware for login page and public API routes
	if (isLoginPage || isPublicApiRoute) {
		return NextResponse.next()
	}

	const token = request.cookies.get('admin_auth')?.value
	console.log('Token from cookie:', token)

	if (isAdminRoute && !token) {
		console.log('No token found, redirecting to login')
		const url = new URL('/admin/login', request.url)
		url.searchParams.set('from', pathname)
		return NextResponse.redirect(url)
	}

	if (token) {
		try {
			// Verify the token
			const decoded = await verifyToken(token)

			if (
				typeof decoded === 'object' &&
				'email' in decoded &&
				'id' in decoded
			) {
				console.log('Token verified for user:', decoded.email)

				// User is authenticated and 2FA verified if needed, allow access
				return NextResponse.next()
			} else {
				throw new Error('Invalid token payload')
			}
		} catch (error) {
			console.log('Token verification failed:', error)
			return NextResponse.redirect(new URL('/admin/login', request.url))
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/admin/:path*'],
}
