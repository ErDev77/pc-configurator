// app/api/configurations/[id]/route.ts
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = await params
	console.log('API: Fetching configuration ID:', id)

	try {
		// Get the configuration
		const configResult = await pool.query(
			'SELECT * FROM configurations WHERE id = $1',
			[id]
		)

		if (configResult.rows.length === 0) {
			console.log('API: Configuration not found')
			return NextResponse.json(
				{ error: 'Configuration not found' },
				{ status: 404 }
			)
		}

		const configuration = configResult.rows[0]
		console.log('API: Configuration found:', configuration)

		// Get the associated products
		const productsResult = await pool.query(
			`
      SELECT p.*
      FROM configuration_products cp
      JOIN products p ON cp.product_id = p.id
      WHERE cp.configuration_id = $1
      `,
			[id]
		)

		const products = productsResult.rows
		console.log('API: Products found:', products.length)

		// Combine configuration with products
		const fullConfiguration = {
			...configuration,
			products,
		}

		return NextResponse.json(fullConfiguration)
	} catch (error) {
		console.error('API Error getting configuration:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = await params
	console.log('API: Deleting configuration ID:', id)
	
	try {
		// Удаляем все связи с продуктами
		await pool.query(
			'DELETE FROM configuration_products WHERE configuration_id = $1',
			[id]
		)

		// Удаляем саму конфигурацию
		await pool.query('DELETE FROM configurations WHERE id = $1', [id])

		console.log('API: Configuration deleted successfully')

		return NextResponse.json({ message: 'Configuration deleted' })
	} catch (error) {
		console.error('API Error deleting configuration:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = params
	console.log('API: Updating configuration ID:', id)

	try {
		const body = await req.json()
		const { name, description, price, image_url, hidden, products } = body

		if (!name || !description || !price || !image_url) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		// Обновляем конфигурацию
		const updateConfigResult = await pool.query(
			`
      UPDATE configurations
      SET name = $1, description = $2, price = $3, image_url = $4, hidden = $5
      WHERE id = $6
      RETURNING *
      `,
			[name, description, price, image_url, hidden ?? null, id]
		)

		if (updateConfigResult.rows.length === 0) {
			console.log('API: Configuration not found for update')
			return NextResponse.json(
				{ error: 'Configuration not found' },
				{ status: 404 }
			)
		}

		const updatedConfiguration = updateConfigResult.rows[0]
		console.log('API: Configuration updated:', updatedConfiguration)

		// Если переданы продукты — добавим их в связующую таблицу
		if (Array.isArray(products) && products.length > 0) {
			const insertPromises = products.map(product =>
				pool.query(
					`
          INSERT INTO configuration_products (configuration_id, product_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
          `,
					[id, product.id, product.quantity ?? 1]
				)
			)

			await Promise.all(insertPromises)
			console.log('API: Products added to configuration')
		}

		return NextResponse.json(updatedConfiguration)
	} catch (error) {
		console.error('API Error updating configuration:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
