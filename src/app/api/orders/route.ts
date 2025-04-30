// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
	try {
		// Get query parameters
		const { searchParams } = new URL(request.url)
		const sinceId = searchParams.get('since')
		const limit = searchParams.get('limit')
		const sortOrder = searchParams.get('sortOrder') || 'desc'

		// Build the base query
		let query = `
      SELECT 
        id, 
        generated_order_number, 
        status, 
        created_at, 
        configuration_id,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_country,
        payment_method,
        subtotal,
        shipping_cost,
        tax,
        total,
        items
      FROM orders
    `

		const params: any[] = []
		let paramIndex = 1

		// Add where clauses
		const whereClauses = []

		// If sinceId is provided, only fetch orders with a higher ID
		if (sinceId) {
			whereClauses.push(`id > $${paramIndex}`)
			params.push(sinceId)
			paramIndex++
		}

		// Add all where clauses to the query
		if (whereClauses.length > 0) {
			query += ` WHERE ${whereClauses.join(' AND ')}`
		}

		// Add order by
		query += ` ORDER BY created_at ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`

		// Add limit if specified
		if (limit) {
			query += ` LIMIT $${paramIndex}`
			params.push(parseInt(limit))
			paramIndex++
		}

		const res = await pool.query(query, params)

		return NextResponse.json(res.rows)
	} catch (error) {
		console.error('Error fetching orders:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch orders' },
			{ status: 500 }
		)
	}
}

// Keep the existing POST handler for creating orders
export async function POST(request: Request) {
	try {
		const orderData = await request.json()

		const { orderNumber, status, configurationId } = orderData

		// SQL query for inserting data
		const query = `
      INSERT INTO orders (generated_order_number, status, configuration_id, created_at) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, generated_order_number, status, configuration_id, created_at;
    `

		const values = [
			orderNumber,
			status || 'pending',
			configurationId,
			new Date().toISOString(),
		]

		const result = await pool.query(query, values)

		return NextResponse.json({
			orderNumber: result.rows[0].generated_order_number,
			status: result.rows[0].status,
			configurationId: result.rows[0].configuration_id,
			createdAt: result.rows[0].created_at,
			message: 'Order placed successfully!',
		})
	} catch (error) {
		console.error('Error while placing order:', error)
		return NextResponse.json(
			{ error: 'Failed to place order' },
			{ status: 500 }
		)
	}
}
