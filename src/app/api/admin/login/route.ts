// src/api/admin/login/route.ts

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { signToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
	try {
		const { email, password } = await req.json()

		console.log('Received credentials:', email, password) // Логирование входных данных

		const result = await pool.query('SELECT * FROM admins WHERE email = $1', [
			email,
		])
		const admin = result.rows[0]

		if (!admin) {
			console.log('Admin not found') // Логирование, если администратор не найден
			return NextResponse.json({ error: 'not found' }, { status: 401 })
		}

		const isValid = await bcrypt.compare(password, admin.password)
		if (!isValid) {
			console.log('Invalid password') // Логирование, если пароль неверный
			return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
		}

		// Создаем токен
		const token = signToken({ id: admin.id, email: admin.email })

		// Получаем cookies с await
		const cookieStore = await cookies()

		// Сохраняем токен в куку
		cookieStore.set('admin_auth', token, {
			httpOnly: true,
			secure: true,
			maxAge: 60 * 60 * 24, // 1 день
			path: '/',
		})

		console.log('Login successful') // Логирование успешного входа
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error during login:', error) // Логирование ошибок
		return NextResponse.json(
			{ error: 'internal server error' },
			{ status: 500 }
		)
	}
}
