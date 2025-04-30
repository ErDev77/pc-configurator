// src/app/api/orders/[id]/route.ts - Fixed version
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET a specific order by ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Use await with params to properly resolve the Promise
		const resolvedParams = await params
		const id = resolvedParams.id

		console.log('API: Fetching order with ID:', id)

		if (!id) {
			return NextResponse.json(
				{ error: 'Order ID is required' },
				{ status: 400 }
			)
		}

		const result = await pool.query(
			`SELECT 
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
      WHERE id = $1`,
			[id]
		)

		if (result.rows.length === 0) {
			return NextResponse.json({ error: 'Order not found' }, { status: 404 })
		}

		return NextResponse.json(result.rows[0])
	} catch (error) {
		console.error('Error fetching order:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch order' },
			{ status: 500 }
		)
	}
}

// PATCH to update an order (expanded to support more fields)
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Use await with params to properly resolve the Promise
		const resolvedParams = await params
		const id = resolvedParams.id

		const body = await request.json()

		if (!id) {
			return NextResponse.json(
				{ error: 'Order ID is required' },
				{ status: 400 }
			)
		}

		// Validate status if provided
		if (body.status) {
			const validStatuses = [
				'pending',
				'processing',
				'shipped',
				'delivered',
				'cancelled',
			]
			if (!validStatuses.includes(body.status.toLowerCase())) {
				return NextResponse.json(
					{
						error:
							'Invalid status. Must be one of: ' + validStatuses.join(', '),
					},
					{ status: 400 }
				)
			}
		}

		// Build dynamic SET clause and values array for the query
		let setClause = []
		let values = []
		let paramIndex = 1

		// List of fields that can be updated
		const updatableFields = [
			'status',
			'customer_first_name',
			'customer_last_name',
			'customer_email',
			'customer_phone',
			'shipping_address',
			'shipping_city',
			'shipping_state',
			'shipping_zip',
			'shipping_country',
			'payment_method',
		]

		// Add each provided field to the SET clause
		for (const field of updatableFields) {
			if (body[field] !== undefined) {
				setClause.push(`${field} = $${paramIndex}`)
				values.push(body[field])
				paramIndex++
			}
		}

		// Always add updated_at
		setClause.push(`updated_at = NOW()`)

		// If nothing to update, return an error
		if (setClause.length === 0) {
			return NextResponse.json(
				{ error: 'No valid fields to update' },
				{ status: 400 }
			)
		}

		// Add the ID to the values array
		values.push(id)

		// Construct and execute the query
		const query = `
      UPDATE orders 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `

		const result = await pool.query(query, values)

		if (result.rows.length === 0) {
			return NextResponse.json({ error: 'Order not found' }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			message: 'Order updated successfully',
			order: result.rows[0],
		})
	} catch (error) {
		console.error('Error updating order:', error)
		return NextResponse.json(
			{ error: 'Failed to update order' },
			{ status: 500 }
		)
	}
}

// DELETE an order
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Use await with params to properly resolve the Promise
		const resolvedParams = await params
		const id = resolvedParams.id

		if (!id) {
			return NextResponse.json(
				{ error: 'Order ID is required' },
				{ status: 400 }
			)
		}

		// Check if order exists before deleting
		const checkResult = await pool.query(
			'SELECT id FROM orders WHERE id = $1',
			[id]
		)

		if (checkResult.rows.length === 0) {
			return NextResponse.json({ error: 'Order not found' }, { status: 404 })
		}

		// Delete the order
		await pool.query('DELETE FROM orders WHERE id = $1', [id])

		return NextResponse.json({
			success: true,
			message: 'Order deleted successfully',
		})
	} catch (error) {
		console.error('Error deleting order:', error)
		return NextResponse.json(
			{ error: 'Failed to delete order' },
			{ status: 500 }
		)
	}
}
