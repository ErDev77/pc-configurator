// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET a specific order by ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id

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

// PATCH to update an order (e.g., change status)
export async function PATCH(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id
		const body = await request.json()

		if (!id) {
			return NextResponse.json(
				{ error: 'Order ID is required' },
				{ status: 400 }
			)
		}

		// Only allowing status updates for now
		// You can expand this to update other fields if needed
		if (!body.status) {
			return NextResponse.json(
				{ error: 'Status is required for updates' },
				{ status: 400 }
			)
		}

		// Validate status
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
					error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
				},
				{ status: 400 }
			)
		}

		// Update the order
		const result = await pool.query(
			`UPDATE orders 
       SET status = $1, 
           updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
			[body.status.toLowerCase(), id]
		)

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
		const id = params.id

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
