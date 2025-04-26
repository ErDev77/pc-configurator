import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

interface NewConfiguration {
	name: string
	description: string
	image_url: string
	price: number
	hidden?: boolean
	products: { id: number }[]
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as NewConfiguration
		const {
			name,
			description,
			image_url,
			price,
			hidden = false,
			products,
		} = body

		if (
			!name ||
			!description ||
			!image_url ||
			!products ||
			products.length === 0
		) {
			return NextResponse.json(
				{ error: 'Все поля обязательны' },
				{ status: 400 }
			)
		}

		const configQuery = `
      INSERT INTO configurations (name, description, image_url, price, hidden)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
		const configValues = [name, description, image_url, price, hidden]
		const configResult = await pool.query(configQuery, configValues)
		const newConfiguration = configResult.rows[0]

		// 2. Теперь вставляем продукты
		const configId = newConfiguration.id

		const productInsertPromises = products.map(product => {
			const productQuery = `
        INSERT INTO configuration_products (configuration_id, product_id)
        VALUES ($1, $2)
      `
			const productValues = [configId, product.id]
			return pool.query(productQuery, productValues)
		})

		await Promise.all(productInsertPromises)

		return NextResponse.json(newConfiguration, { status: 201 })
	} catch (error) {
		console.error('Ошибка создания конфигурации:', error)
		return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
	}
}


export async function GET() {
	const { rows } = await pool.query(
		'SELECT * FROM configurations ORDER BY created_at DESC'
	)
	return NextResponse.json(rows)
}
