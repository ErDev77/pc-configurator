// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
	// Properly await the cookie store
	const cookieStore = await cookies()

	cookieStore.set('admin_auth', '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production', // Убедитесь, что secure стоит правильно
		maxAge: 0, // Удаление куки
		path: '/',
	})


	return NextResponse.json({ success: true })
}
