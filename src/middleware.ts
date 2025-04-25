import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
	const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
	const isLoginPage = request.nextUrl.pathname === '/admin/login'
	const auth = request.cookies.get('admin_auth')?.value

	if (isAdminRoute && !isLoginPage && auth !== 'ok') {
		return NextResponse.redirect(new URL('/admin/login', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/admin/:path*'],
}
