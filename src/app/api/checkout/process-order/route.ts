// src/app/api/checkout/process-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import nodemailer from 'nodemailer'

// Define types for better code structure
interface OrderItem {
	id: number | string
	name: string
	price: number
	quantity: number
	totalPrice: number
	configId?: number
	configName?: string
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

// Helper function to ensure price values are properly formatted
function formatPrice(price: any): number {
	if (typeof price === 'object' && price !== null) {
		// If it's an object, try to extract the value
		return price.value || price.price || 0
	}

	if (typeof price === 'string') {
		// If it's a string, try to parse it
		const parsed = parseFloat(price)
		return isNaN(parsed) ? 0 : parsed
	}

	// If it's already a number, just return it
	return typeof price === 'number' ? price : 0
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

		// Ensure price values are numbers
		if (orderData.totals) {
			orderData.totals.subtotal = formatPrice(orderData.totals.subtotal)
			orderData.totals.shipping = formatPrice(orderData.totals.shipping)
			orderData.totals.tax = formatPrice(orderData.totals.tax)
			orderData.totals.total = formatPrice(orderData.totals.total)
		}

		// Ensure price values are numbers in items
		if (orderData.items) {
			orderData.items = orderData.items.map(item => ({
				...item,
				price: formatPrice(item.price),
				totalPrice: formatPrice(item.totalPrice),
			}))
		}

		// 1. Store the order in the database
		const order = await createOrder(orderData)

		// 2. Send notifications based on preferences and admin settings
		const notificationResults = { email: false, telegram: false }

		// Check admin notification settings
		const settingsResult = await pool.query(
			`SELECT value FROM settings WHERE key = 'notifications'`
		)

		let adminNotificationSettings = {
			email: true,
			telegram: true,
		}

		if (settingsResult.rows.length > 0) {
			adminNotificationSettings = settingsResult.rows[0].value
		}

		// Only send notifications if both user and admin settings allow it
		if (orderData.notifications.email && adminNotificationSettings.email) {
			notificationResults.email = await sendEmailNotification(orderData)
		}

		if (
			orderData.notifications.telegram &&
			adminNotificationSettings.telegram
		) {
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
    shipping_country,
    items
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  RETURNING id
`

	const orderValues = [
		orderData.orderNumber,
		'pending',
		new Date().toISOString(),
		orderData.customer.firstName,
		orderData.customer.lastName,
		orderData.customer.email,
		orderData.customer.phone,
		orderData.shipping.address,
		orderData.payment.method,
		orderData.totals.total,
		orderData.totals.subtotal,
		orderData.totals.shipping,
		orderData.totals.tax,
		orderData.shipping.city,
		orderData.shipping.state,
		orderData.shipping.zipCode,
		orderData.shipping.country,
		JSON.stringify(orderData.items), // Store items as JSON directly in the orders table
	]

	const orderResult = await pool.query(orderQuery, orderValues)
	const orderId = orderResult.rows[0].id

	// No need to insert into order_items table anymore
	return { id: orderId }
}

// Create formatted HTML for order details - used in both email and telegram
function createOrderDetailsHtml(orderData: OrderData): string {
	// Create a list of items with their details and components
	const itemsList = orderData.items
		.map((item: OrderItem) => {
			const itemDetails = `<h3>${item.name || item.configName} - ${
				item.quantity
			} x $${formatPrice(item.price).toFixed(2)} = $${formatPrice(
				item.price * item.quantity
			).toFixed(2)}</h3>`

			// Add components details if available
			let componentsDetails = ''
			if (item.components && item.components.length > 0) {
				componentsDetails = `
				<ul style="margin-left: 20px; margin-top: 5px; margin-bottom: 15px;">
					${item.components
						.map(
							comp => `
						<li style="margin-bottom: 5px;">
							${comp.name} - $${formatPrice(comp.price).toFixed(2)}
						</li>
					`
						)
						.join('')}
				</ul>`
			}

			return `${itemDetails}${componentsDetails}`
		})
		.join('')

	// Create full HTML content
	return `
    <h1>New Order Notification</h1>
    <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
    <p><strong>Customer:</strong> ${orderData.customer.firstName} ${
		orderData.customer.lastName
	}</p>
    <p><strong>Email:</strong> ${orderData.customer.email}</p>
    <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
    <h2>Order Details</h2>
    <div>
      ${itemsList}
    </div>
    <p><strong>Subtotal:</strong> $${formatPrice(
			orderData.totals.subtotal
		).toFixed(2)}</p>
    <p><strong>Shipping:</strong> $${formatPrice(
			orderData.totals.shipping
		).toFixed(2)}</p>
    <p><strong>Tax:</strong> $${formatPrice(orderData.totals.tax).toFixed(
			2
		)}</p>
    <p><strong>Total:</strong> $${formatPrice(orderData.totals.total).toFixed(
			2
		)}</p>
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
}

// Create plain text version of order details for Telegram
function createOrderDetailsText(orderData: OrderData): string {
	// Create a list of items with their details and components
	const itemsList = orderData.items
		.map((item: OrderItem) => {
			const itemDetails = `- ${item.name || item.configName} - ${
				item.quantity
			} x $${formatPrice(item.price).toFixed(2)} = $${formatPrice(
				item.price * item.quantity
			).toFixed(2)}`

			// Add components details if available
			let componentsDetails = ''
			if (item.components && item.components.length > 0) {
				componentsDetails = `\n  Components:\n${item.components
					.map(
						comp =>
							`    • ${comp.name} - $${formatPrice(comp.price).toFixed(2)}`
					)
					.join('\n')}`
			}

			return `${itemDetails}${componentsDetails}`
		})
		.join('\n')

	// Create full text content
	return `
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

📍 Shipping Address:
${orderData.shipping.address}
${orderData.shipping.city}, ${orderData.shipping.state} ${
		orderData.shipping.zipCode
	}
${orderData.shipping.country}

💳 Payment Method: ${
		orderData.payment.method === 'credit-card' ? 'Credit Card' : 'PayPal'
	}

View details in admin panel: /admin/orders/${orderData.orderNumber}
  `
}

// Send email notification - direct implementation instead of using fetch
async function sendEmailNotification(orderData: OrderData) {
	try {
		// Check if email notifications are enabled in global settings
		const settingsResult = await pool.query(
			`SELECT value->>'email' as email_enabled 
       FROM settings 
       WHERE key = 'notifications'`
		)

		if (settingsResult.rows.length > 0) {
			const emailEnabled = settingsResult.rows[0].email_enabled === 'true'
			if (!emailEnabled) {
				console.log('Email notifications are disabled in admin settings')
				return false
			}
		}

		// Get admin email (or use from .env)
		const adminResult = await pool.query(
			'SELECT email FROM admins ORDER BY id ASC LIMIT 1'
		)

		const to =
			adminResult.rows.length > 0
				? adminResult.rows[0].email
				: process.env.EMAIL_TO

		if (!to) {
			console.error('No recipient email address found')
			return false
		}

		// Configure email transport
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.EMAIL_PORT || '587'),
			secure: process.env.EMAIL_SECURE === 'true',
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASSWORD,
			},
		})

		// Create the email content
		const emailContent = createOrderDetailsHtml(orderData)

		// Send the email
		const result = await transporter.sendMail({
			from: process.env.EMAIL_FROM || 'yourstore@example.com',
			to,
			subject: `New Order #${orderData.orderNumber}`,
			html: emailContent,
		})

		console.log(`Email notification sent for order ${orderData.orderNumber}`)
		return true
	} catch (error) {
		console.error('Email sending error:', error)
		return false
	}
}

// Send Telegram notification - direct implementation instead of using fetch
async function sendTelegramNotification(orderData: OrderData) {
	try {
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
				return false
			}
		}

		const botToken = process.env.TELEGRAM_BOT_TOKEN
		const chatId = process.env.TELEGRAM_CHAT_ID

		if (!botToken || !chatId) {
			console.warn('Telegram bot token or chat ID not configured')
			// Return false since Telegram is not properly configured
			return false
		}

		// Create detailed message similar to email
		const message = createOrderDetailsText(orderData)

		// Send telegram notification using absolute URL
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
					parse_mode: 'HTML',
				}),
			}
		)

		const data = await response.json()

		if (!data.ok) {
			console.error('Telegram API error:', data.description)
			return false
		}

		console.log('Telegram notification sent successfully')
		return true
	} catch (error) {
		console.error('Telegram sending error:', error)
		return false
	}
}
