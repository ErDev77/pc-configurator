import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = parseInt(params.id)

		if (isNaN(id)) {
			return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 })
		}

		const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [
			id,
		])

		if (rows.length === 0) {
			return NextResponse.json({ error: 'Продукт не найден' }, { status: 404 })
		}

		return NextResponse.json({ product: rows[0] }, { status: 200 })
	} catch (error) {
		console.error('Ошибка при получении продукта:', error)
		return NextResponse.json(
			{ error: 'Ошибка сервера при получении продукта' },
			{ status: 500 }
		)
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = parseInt(params.id)

		if (isNaN(id)) {
			return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 })
		}

		const body = await req.json()

		const { name, price, brand, image_url, hidden, category_id } = body

		if (!name || !price || !brand || !image_url || !category_id) {
			return NextResponse.json(
				{ error: 'Заполните все обязательные поля' },
				{ status: 400 }
			)
		}

		await pool.query(
			`UPDATE products 
       SET name = $1, price = $2, brand = $3, image_url = $4, hidden = $5, category_id = $6
       WHERE id = $7`,
			[name, price, brand, image_url, hidden ?? false, category_id, id]
		)

		return NextResponse.json(
			{ message: 'Продукт успешно обновлен' },
			{ status: 200 }
		)
	} catch (error) {
		console.error('Ошибка при обновлении продукта:', error)
		return NextResponse.json(
			{ error: 'Ошибка сервера при обновлении' },
			{ status: 500 }
		)
	}
}

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
