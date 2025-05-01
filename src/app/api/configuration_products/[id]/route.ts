import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {


		// Get the configuration products
		const configProducts = await pool.query(
			`SELECT cp.*, p.* 
       FROM configuration_products cp
       JOIN products p ON cp.product_id = p.id
       WHERE cp.configuration_id = $1`,
			[params.id]
		)

		if (!configProducts || configProducts.rows.length === 0) {
			console.log('API: No products found for this configuration')
			return NextResponse.json({ products: [] }, { status: 200 })
		}

		console.log(`API: Products found: ${configProducts.rows.length}`)

		return NextResponse.json({ products: configProducts.rows }, { status: 200 })
	} catch (error) {
		console.error('API Error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch configuration products' },
			{ status: 500 }
		)
	}
}
