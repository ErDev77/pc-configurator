import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

interface NewConfiguration {
	name: string
	description: string
	image_url: string
	price: number
	hidden?: boolean
	products: { id: number }[]
	custom_id?: string
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
			custom_id,
		} = body
		console.log('Received configuration with custom_id:', custom_id)

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

		if (custom_id) {
			const checkResult = await pool.query(
				'SELECT id FROM configurations WHERE custom_id = $1',
				[custom_id]
			)

			if (checkResult.rows.length > 0) {
				return NextResponse.json(
					{ error: 'This custom ID is already in use' },
					{ status: 400 }
				)
			}
		}
		const configQuery = `
      INSERT INTO configurations (name, description, image_url, price, hidden, custom_id)
	  VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `
		const configValues = [name, description, image_url, price, hidden, custom_id || null]
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
