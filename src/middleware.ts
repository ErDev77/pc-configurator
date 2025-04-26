import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname
	const isAdminRoute = pathname.startsWith('/admin')
	const isLoginPage = pathname === '/admin/login'

	console.log('Middleware checking route:', pathname)

	// 1. Если мы на странице логина, пропускаем без всяких проверок
	if (isLoginPage) {
		return NextResponse.next()
	}

	const token = request.cookies.get('admin_auth')?.value
	console.log('Token from cookie:', token)

	// 2. Если нет токена на админке — редиректим на логин
	if (isAdminRoute && !token) {
		console.log('No token found, redirecting to login')
		return NextResponse.redirect(new URL('/admin/login', request.url))
	}

	// 3. Если токен есть, проверяем его
	if (token) {
		try {
			const decoded = await verifyToken(token) // ← ← ← добавил await !!!

			if (
				typeof decoded === 'object' &&
				'email' in decoded &&
				'id' in decoded
			) {
				console.log('Token verified for user:', decoded.email)
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
