// app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
	const cookieStore = cookies()
	;(await cookieStore).set('admin_auth', '', {
		httpOnly: true,
		secure: true,
		maxAge: 0, 
		path: '/',
	})

	return NextResponse.json({ success: true })
}
