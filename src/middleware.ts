import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname
	const isAdminRoute = pathname.startsWith('/admin')
	const isLoginPage = pathname === '/admin/login'
	const isPublicApiRoute =
		pathname.startsWith('/api/admin/login') ||
		pathname.startsWith('/api/admin/2fa')

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

				// Check if 2FA is required based only on the token info
				// We'll include 2FA status in the token when we generate it
				if (decoded.twoFactorEnabled && !decoded.twoFactorVerified) {
					console.log('2FA verification required for user:', decoded.email)
					// User has not completed 2FA verification, redirect to login with 2FA flag
					const url = new URL('/admin/login', request.url)
					url.searchParams.set('require2fa', 'true')
					url.searchParams.set('from', pathname)
					return NextResponse.redirect(url)
				}

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
