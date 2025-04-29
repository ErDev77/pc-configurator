// Update src/app/api/checkout/route.ts
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: { json: () => any }) {
	try {
		const body = await request.json()
		console.log('Received order data:', body)

		// Basic validation
		if (!body.customer || !body.items || !body.totals) {
			throw new Error('Missing required fields in the order data')
		}

		// Extract data from the request body
		const { orderNumber, customer, shipping, payment, items, totals } = body

		// Insert the order into the database with all the additional information
		const query = `
      INSERT INTO orders (
        generated_order_number, 
        status, 
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
        items,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING id, generated_order_number
    `

		// Get the configuration ID if available (some orders might not have a specific configuration)
		const configId = items[0]?.configId || null

		const values = [
			orderNumber,
			'pending', // Default status
			configId,
			customer.firstName,
			customer.lastName,
			customer.email,
			customer.phone,
			shipping?.address || '',
			shipping?.city || '',
			shipping?.state || '',
			shipping?.zipCode || '',
			shipping?.country || '',
			payment?.method || '',
			totals.subtotal,
			totals.shipping,
			totals.tax,
			totals.total,
			JSON.stringify(items), // Store items as JSON
			new Date().toISOString(),
		]

		const result = await pool.query(query, values)
		const insertedOrder = result.rows[0]

		// Return success response
		return NextResponse.json({
			success: true,
			orderNumber: insertedOrder.generated_order_number,
			orderId: insertedOrder.id,
		})
	} catch (error) {
		console.error('Error in /api/checkout:', error)
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json(
			{ success: false, error: errorMessage },
			{ status: 500 }
		)
	}
}
