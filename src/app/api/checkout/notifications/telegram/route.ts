// src/app/api/checkout/notifications/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Define the shape of order items
interface CartItem {
	name: string
	quantity: number
	price: number
	totalPrice: number
	components?: any[]
	configName?: string
}

// Define the shape of order data
interface OrderData {
	orderNumber: string
	customer: {
		firstName: string
		lastName: string
		email: string
		phone: string
	}
	items: CartItem[]
	totals: {
		subtotal: number
		shipping: number
		tax: number
		total: number
	}
}

// Helper function to format prices consistently
function formatPrice(price: any): number {
	if (typeof price === 'object' && price !== null) {
		return price.value || price.price || 0
	}

	if (typeof price === 'string') {
		const parsed = parseFloat(price)
		return isNaN(parsed) ? 0 : parsed
	}

	return typeof price === 'number' ? price : 0
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { orderData } = body

		if (!orderData) {
			return NextResponse.json(
				{ success: false, error: 'Order data is required' },
				{ status: 400 }
			)
		}

		// Check if telegram notifications are enabled in global settings
		const settingsResult = await pool.query(
			`SELECT value->>'telegram' as telegram_enabled 
       FROM settings 
       WHERE key = 'notifications'`
		)

		if (settingsResult.rows.length > 0) {
			const telegramEnabled = settingsResult.rows[0].telegram_enabled === 'true'
			if (!telegramEnabled) {
				console.log('Telegram notifications are disabled in admin settings')
				return NextResponse.json({
					success: true,
					message: 'Telegram notifications are disabled',
				})
			}
		}

		const botToken = process.env.TELEGRAM_BOT_TOKEN
		const chatId = process.env.TELEGRAM_CHAT_ID

		if (!botToken || !chatId) {
			console.warn('Telegram bot token or chat ID not configured')
			// Return success even if not configured to avoid blocking checkout
			return NextResponse.json({
				success: true,
				warning: 'Telegram not configured',
			})
		}

		// Create a detailed message with components info
		const itemsList = orderData.items
			.map((item: CartItem) => {
				const itemDetails = `- ${item.name || item.configName} - ${
					item.quantity
				} x $${formatPrice(item.price).toFixed(2)} = $${(
					formatPrice(item.price) * item.quantity
				).toFixed(2)}`

				// Add components if they exist
				let componentsText = ''
				if (item.components && item.components.length > 0) {
					componentsText = `\n  Components:\n${item.components
						.map(
							comp =>
								`    • ${comp.name} - $${formatPrice(comp.price).toFixed(2)}`
						)
						.join('\n')}`
				}

				return `${itemDetails}${componentsText}`
			})
			.join('\n')

		const message = `
🛒 NEW ORDER #${orderData.orderNumber}

👤 Customer: ${orderData.customer.firstName} ${orderData.customer.lastName}
📧 Email: ${orderData.customer.email}
📱 Phone: ${orderData.customer.phone}

📦 Order Details:
${itemsList}

💰 Subtotal: $${formatPrice(orderData.totals.subtotal).toFixed(2)}
🚚 Shipping: $${formatPrice(orderData.totals.shipping).toFixed(2)}
💲 Tax: $${formatPrice(orderData.totals.tax).toFixed(2)}
💵 Total: $${formatPrice(orderData.totals.total).toFixed(2)}

View details in admin panel: /admin/orders/${orderData.orderNumber}
    `

		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendMessage`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chat_id: chatId,
					text: message,
				}),
			}
		)

		const data = await response.json()

		if (!data.ok) {
			throw new Error(data.description || 'Failed to send Telegram message')
		}

		console.log('Telegram notification sent successfully')
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Telegram sending error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to send Telegram notification' },
			{ status: 500 }
		)
	}
}
