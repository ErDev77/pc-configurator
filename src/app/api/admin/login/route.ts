import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/jwt'
import pool from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
	try {
		const { email, password } = await req.json()

		const result = await pool.query('SELECT * FROM admins WHERE email = $1', [
			email,
		])
		const admin = result.rows[0]

		if (!admin) {
			return NextResponse.json({ error: 'Admin not found' }, { status: 401 })
		}

		const isValid = await bcrypt.compare(password, admin.password)
		if (!isValid) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const token = await signToken({ id: admin.id, email: admin.email })

		// Дожидаемся получения cookies() промиса
		const cookieStore = await cookies() // Здесь ждем, чтобы получить доступ к методам cookies

		// Создаём куку корректно с исправленным значением для sameSite
		cookieStore.set('admin_auth', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production', // Только в проде Secure
			path: '/',
			sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // исправлено на нижний регистр
			maxAge: 60 * 60 * 24, // 1 день
		})

		console.log('Setting cookie with token:', token)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error during login:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}