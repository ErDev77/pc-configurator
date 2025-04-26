import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function GET(req: NextRequest) {
	try {
		const cookieStore = await cookies()
		const token = cookieStore.get('admin_auth')?.value

		console.log('Token from cookie:', token) // Логирование токена из куки

		if (!token) {
			return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
		}

		// Добавляем await для корректного получения результата
		const decoded = await verifyToken(token) // Используем await

		console.log('Decoded token:', decoded) // Логирование декодированного токена

		return NextResponse.json({ id: decoded.id, email: decoded.email })
	} catch (error) {
		console.error('Ошибка декодирования токена', error)
		return NextResponse.json({ error: 'invalid token' }, { status: 401 })
	}
}
