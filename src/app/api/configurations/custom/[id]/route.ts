// src/app/api/configurations/custom/[id]/route.ts
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	const { id } = await params
	console.log('API: Fetching configuration by custom_id:', id)

	try {
		// Get the configuration by custom_id
		const configResult = await pool.query(
			'SELECT * FROM configurations WHERE custom_id = $1',
			[id]
		)

		if (configResult.rows.length === 0) {
			console.log('API: Configuration not found by custom_id')
			return NextResponse.json(
				{ error: 'Configuration not found' },
				{ status: 404 }
			)
		}

		const configuration = configResult.rows[0]
		console.log('API: Configuration found by custom_id:', configuration.id)

		// Get the associated products
		const productsResult = await pool.query(
			`
      SELECT p.*
      FROM configuration_products cp
      JOIN products p ON cp.product_id = p.id
      WHERE cp.configuration_id = $1
      `,
			[configuration.id]
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
		console.error('API Error getting configuration by custom_id:', error)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
