import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname
	const isAdminRoute = pathname.startsWith('/admin')
	const isLoginPage = pathname === '/admin/login'
	const isPublicApiRoute =
		pathname.startsWith('/api/admin/login')

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
		url.searchParams.set('reason', 'no_token')
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

			// Check if the error is due to token expiration
			if (
				error instanceof Error &&
				(error.message.includes('exp') || error.message.includes('expired'))
			) {
				console.log('Token expired, redirecting to login')

				// Clear the expired cookie
				const response = NextResponse.redirect(
					new URL('/admin/login', request.url)
				)
				response.cookies.set('admin_auth', '', {
					expires: new Date(0),
					path: '/',
				})

				// Add reason to URL
				const url = new URL(response.url)
				url.searchParams.set('reason', 'session_expired')
				url.searchParams.set('from', pathname)

				return NextResponse.redirect(url)
			}

			// For other token errors, also redirect to login
			return NextResponse.redirect(new URL('/admin/login', request.url))
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/admin/:path*'],
}
