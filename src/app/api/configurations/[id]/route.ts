import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Получить одну конфигурацию по ID
export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = params

	try {
		const result = await pool.query(
			'SELECT * FROM configurations WHERE id = $1',
			[id]
		)

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ error: 'Конфигурация не найдена' },
				{ status: 404 }
			)
		}

		return NextResponse.json(result.rows[0])
	} catch (error) {
		console.error('Ошибка получения конфигурации:', error)
		return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
	}
}

// Обновить конфигурацию по ID
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = params
	const { name, description, image_url, price, products } = await request.json()

	try {
		// Проверим, что конфигурация существует
		const configCheck = await pool.query(
			'SELECT * FROM configurations WHERE id = $1',
			[id]
		)

		if (configCheck.rows.length === 0) {
			return NextResponse.json(
				{ error: 'Конфигурация не найдена' },
				{ status: 404 }
			)
		}

		// Обновляем конфигурацию
		await pool.query(
			'UPDATE configurations SET name = $1, description = $2, image_url = $3, price = $4 WHERE id = $5',
			[name, description, image_url, price, id]
		)

		// Удаляем старые привязанные продукты
		await pool.query(
			'DELETE FROM configuration_products WHERE configuration_id = $1',
			[id]
		)

		// Добавляем новые привязанные продукты
		for (const product of products) {
			await pool.query(
				'INSERT INTO configuration_products (configuration_id, product_id) VALUES ($1, $2)',
				[id, product.id]
			)
		}

		return NextResponse.json(
			{ message: 'Конфигурация успешно обновлена' },
			{ status: 200 }
		)
	} catch (error) {
		console.error('Ошибка обновления конфигурации:', error)
		return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
	}
}

// Удалить конфигурацию по ID
export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const { id } = params

	try {
		// Сначала удаляем связанные продукты
		await pool.query(
			'DELETE FROM configuration_products WHERE configuration_id = $1',
			[id]
		)

		// Потом сам конфиг
		await pool.query('DELETE FROM configurations WHERE id = $1', [id])

		return NextResponse.json(
			{ message: 'Конфигурация удалена' },
			{ status: 200 }
		)
	} catch (error) {
		console.error('Ошибка удаления конфигурации:', error)
		return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
	}
}
