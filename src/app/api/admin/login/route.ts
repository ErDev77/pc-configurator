// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
	const { email, password } = await req.json()

	const result = await pool.query('SELECT * FROM admins WHERE email = $1', [
		email,
	])
	const admin = result.rows[0]

	if (!admin) return NextResponse.json({ error: 'not found' }, { status: 401 })

	const isValid = await bcrypt.compare(password, admin.password)
	if (!isValid)
		return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

	;(await cookies()).set('admin_auth', 'ok', {
		httpOnly: true,
		secure: true,
		maxAge: 60 * 60 * 24,
		path: '/',
	})

	return NextResponse.json({ success: true })
}
