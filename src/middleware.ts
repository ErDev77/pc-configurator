import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt' // подключаем нашу верификацию

export function middleware(request: NextRequest) {
	const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
	const isLoginPage = request.nextUrl.pathname === '/admin/login'

	const token = request.cookies.get('admin_auth')?.value

	if (isAdminRoute && !isLoginPage) {
		if (!token) {
			// Нет токена вообще
			return NextResponse.redirect(new URL('/admin/login', request.url))
		}

		try {
			verifyToken(token) // Если не выбросит ошибку - токен валидный
		} catch (error) {
			// Токен плохой или протухший
			return NextResponse.redirect(new URL('/admin/login', request.url))
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/admin/:path*'],
}
