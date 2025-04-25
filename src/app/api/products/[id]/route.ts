import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = parseInt(params.id)

		if (isNaN(id)) {
			return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 })
		}

		await pool.query('DELETE FROM products WHERE id = $1', [id])

		return NextResponse.json({ message: 'Компонент удалён' }, { status: 200 })
	} catch (error) {
		console.error('Ошибка при удалении компонента:', error)
		return NextResponse.json(
			{ error: 'Ошибка сервера при удалении' },
			{ status: 500 }
		)
	}
}
