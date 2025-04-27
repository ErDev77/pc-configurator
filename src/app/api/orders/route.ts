import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
	try {
		const res = await pool.query(
			'SELECT id, generated_order_number, status, created_at, configuration_id FROM orders'
		)
		return NextResponse.json(res.rows)
	} catch (error) {
		console.error('Ошибка при получении заказов:', error)
		return NextResponse.error()
	}
}

export async function POST(request: Request) {
	try {
		const orderData = await request.json()

		const {
			orderNumber,
			status, // Статус заказа
			configurationId, // ID конфигурации
		} = orderData

		// SQL запрос для вставки данных
		const query = `
      INSERT INTO orders (generated_order_number, status, configuration_id, created_at) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, generated_order_number, status, configuration_id, created_at;
    `

		const values = [
			orderNumber,
			status || 'pending', // Если статус не передан, по умолчанию 'pending'
			configurationId, // ID конфигурации
			new Date().toISOString(), // Вставляем текущую дату как created_at
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
		return NextResponse.error()
	}
}
