// src/app/api/checkout/process-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// Define types for better code structure
interface OrderItem {
	id: number | string
	name: string
	price: number
	quantity: number
	totalPrice: number
	components?: any[]
}

interface Customer {
	firstName: string
	lastName: string
	email: string
	phone: string
}

interface ShippingAddress {
	address: string
	city: string
	state: string
	zipCode: string
	country: string
}

interface PaymentDetails {
	method: string
	cardDetails?: any
}

interface OrderTotals {
	subtotal: number
	shipping: number
	tax: number
	total: number
}

interface NotificationPreferences {
	email: boolean
	telegram: boolean
}

interface OrderData {
	orderNumber: string
	customer: Customer
	shipping: ShippingAddress
	payment: PaymentDetails
	items: OrderItem[]
	totals: OrderTotals
	notifications: NotificationPreferences
	orderedAt: string
}

export async function POST(request: NextRequest) {
	try {
		const orderData: OrderData = await request.json()

		// Validate required fields
		if (
			!orderData.orderNumber ||
			!orderData.customer ||
			!orderData.items ||
			orderData.items.length === 0
		) {
			return NextResponse.json(
				{ success: false, error: 'Missing required order data' },
				{ status: 400 }
			)
		}

		// 1. Store the order in the database
		const order = await createOrder(orderData)

		// 2. Send notifications based on preferences
		const notificationResults = { email: false, telegram: false }

		// Only send notifications if requested by the user
		if (orderData.notifications.email) {
			notificationResults.email = await sendEmailNotification(orderData)
		}

		if (orderData.notifications.telegram) {
			notificationResults.telegram = await sendTelegramNotification(orderData)
		}

		// 3. Return success response with order details
		return NextResponse.json({
			success: true,
			orderNumber: orderData.orderNumber,
			orderId: order.id,
			notifications: notificationResults,
		})
	} catch (error) {
		console.error('Error processing order:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to process order' },
			{ status: 500 }
		)
	}
}

// Create order in database
async function createOrder(orderData: OrderData) {
	// Create main order record
	const orderQuery = `
    INSERT INTO orders (
      generated_order_number, 
      status, 
      created_at,
      customer_first_name,
	  customer_last_name,
      customer_email,
      customer_phone,
      shipping_address,
      payment_method,
      total,
	  subtotal,
	  shipping_cost,
	  tax,
	  shipping_city,
	  shipping_state,
	  shipping_zip,
	  shipping_country
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `

	const orderValues = [
		orderData.orderNumber,
		'pending', // Default status
		new Date().toISOString(),
		`${orderData.customer.firstName} ${orderData.customer.lastName}`,
		orderData.customer.email,
		orderData.customer.phone,
		JSON.stringify(orderData.shipping),
		orderData.payment.method,
		orderData.totals.total,
	]

	const orderResult = await pool.query(orderQuery, orderValues)
	const orderId = orderResult.rows[0].id

	// Store order items
	for (const item of orderData.items) {
		await pool.query(
			`INSERT INTO order_items (
        order_id, 
        product_id, 
        quantity, 
        price, 
        total_price
      ) VALUES ($1, $2, $3, $4, $5)`,
			[
				orderId,
				item.id,
				item.quantity,
				item.price,
				item.totalPrice * item.quantity,
			]
		)
	}

	return { id: orderId }
}

// Send email notification
async function sendEmailNotification(orderData: OrderData) {
	try {
		const itemsList = orderData.items
			.map(
				(item: OrderItem) =>
					`${item.name} x ${item.quantity} - $${(
						item.totalPrice * item.quantity
					).toFixed(2)}`
			)
			.join('\n')

		const emailContent = `
      <h1>New Order Notification</h1>
      <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
      <p><strong>Customer:</strong> ${orderData.customer.firstName} ${
			orderData.customer.lastName
		}</p>
      <p><strong>Email:</strong> ${orderData.customer.email}</p>
      <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
      <h2>Order Details</h2>
      <p><strong>Items:</strong></p>
      <pre>${itemsList}</pre>
      <p><strong>Subtotal:</strong> $${orderData.totals.subtotal.toFixed(2)}</p>
      <p><strong>Shipping:</strong> $${orderData.totals.shipping.toFixed(2)}</p>
      <p><strong>Tax:</strong> $${orderData.totals.tax.toFixed(2)}</p>
      <p><strong>Total:</strong> $${orderData.totals.total.toFixed(2)}</p>
      <h2>Shipping Address</h2>
      <p>${orderData.shipping.address}</p>
      <p>${orderData.shipping.city}, ${orderData.shipping.state} ${
			orderData.shipping.zipCode
		}</p>
      <p>${orderData.shipping.country}</p>
      <p>Payment Method: ${
				orderData.payment.method === 'credit-card' ? 'Credit Card' : 'PayPal'
			}</p>
    `

		// Fetch email settings from database or environment variables
		const { emailEnabled, emailRecipient } = await getNotificationSettings()

		if (!emailEnabled) {
			console.log('Email notifications are disabled in settings')
			return false
		}

		// Send email only if enabled in admin settings
		const response = await fetch('/api/notifications/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				to: emailRecipient || process.env.EMAIL_TO,
				subject: `New Order #${orderData.orderNumber}`,
				html: emailContent,
			}),
		})

		return response.ok
	} catch (error) {
		console.error('Error sending email notification:', error)
		return false
	}
}

// Send Telegram notification
async function sendTelegramNotification(orderData: OrderData) {
	try {
		// Fetch telegram settings from database or environment variables
		const { telegramEnabled } = await getNotificationSettings()

		if (!telegramEnabled) {
			console.log('Telegram notifications are disabled in settings')
			return false
		}

		const message = `
      🛒 NEW ORDER #${orderData.orderNumber}

      Customer: ${orderData.customer.firstName} ${orderData.customer.lastName}
      Email: ${orderData.customer.email}
      Phone: ${orderData.customer.phone}
      Total: $${orderData.totals.total.toFixed(2)}
      Items: ${orderData.items.length}

      View details in admin panel: /admin/orders/${orderData.orderNumber}
    `

		// Send telegram notification only if enabled in admin settings
		const response = await fetch('/api/notifications/telegram', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ message }),
		})

		return response.ok
	} catch (error) {
		console.error('Error sending telegram notification:', error)
		return false
	}
}

// Get notification settings from database
async function getNotificationSettings() {
	try {
		// Try to fetch from database if settings table exists
		const settingsResult = await pool.query(
			'SELECT * FROM notification_settings WHERE is_active = true LIMIT 1'
		)

		if (settingsResult.rows.length > 0) {
			const settings = settingsResult.rows[0]
			return {
				emailEnabled: settings.email_enabled || true,
				telegramEnabled: settings.telegram_enabled || true,
				emailRecipient: settings.email_recipient || process.env.EMAIL_TO,
			}
		}

		// Fallback to environment variables
		return {
			emailEnabled: process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false',
			telegramEnabled: process.env.TELEGRAM_NOTIFICATIONS_ENABLED !== 'false',
			emailRecipient: process.env.EMAIL_TO,
		}
	} catch (error) {
		console.error('Error getting notification settings:', error)

		// Default values if database query fails
		return {
			emailEnabled: true,
			telegramEnabled: true,
			emailRecipient: process.env.EMAIL_TO,
		}
	}
}
