// app/api/checkout/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: { json: () => any }) {
	try {
		const body = await request.json()
		console.log('Received order data:', body)

		// Пример проверки данных
		if (!body.customer || !body.items || !body.totals) {
			throw new Error('Missing required fields in the order data')
		}

		// Возвращаем успешный ответ
		return NextResponse.json({ success: true, orderNumber: body.orderNumber })
	} catch (error) {
		console.error('Error in /api/checkout:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		return NextResponse.json(
			{ success: false, error: errorMessage },
			{ status: 500 }
		)
	}
}
